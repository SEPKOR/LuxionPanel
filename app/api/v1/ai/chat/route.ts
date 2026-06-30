import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { decrypt } from "@/lib/crypto";
import { tools, executeToolCall } from "@/lib/ai-tools";
import { env } from "@/lib/config";

/* ---------- types ---------- */

interface ProviderConfig {
  baseUrl: string;
  model: string;
  apiKey: string | undefined;
  isOpenAI: boolean;
}

interface ChatMessagePayload {
  role: string;
  content: string | null;
  tool_calls?: ToolCallPayload[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCallPayload {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}

interface OllamaToolCallRaw {
  function?: { name?: string; arguments?: Record<string, unknown> };
}

interface OllamaMessage {
  content?: string | null;
  tool_calls?: OllamaToolCallRaw[];
}

/* ---------- helpers ---------- */

async function getProviderConfig(userId: string): Promise<ProviderConfig> {
  const defaultKey = await prisma.apiKey.findFirst({
    where: { userId, isDefault: true },
  });

  if (defaultKey) {
    try {
      return {
        baseUrl: defaultKey.baseUrl || env.OPENAI_COMPATIBLE_BASE_URL || env.LUXION_OLLAMA_URL,
        model: defaultKey.model || "gpt-4o-mini",
        apiKey: defaultKey.apiKey ? decrypt(defaultKey.apiKey) : undefined,
        isOpenAI: !!defaultKey.baseUrl || defaultKey.provider !== "ollama",
      };
    } catch {
      // Fall through
    }
  }

  if (env.OPENAI_COMPATIBLE_BASE_URL) {
    return {
      baseUrl: env.OPENAI_COMPATIBLE_BASE_URL,
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      apiKey: env.OPENAI_API_KEY || undefined,
      isOpenAI: true,
    };
  }

  return {
    baseUrl: env.LUXION_OLLAMA_URL,
    model: env.LUXION_OLLAMA_MODEL,
    apiKey: undefined,
    isOpenAI: false,
  };
}

/* ---------- GET — chat history ---------- */

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return ok(
    messages.reverse().map((msg: { id: string; role: string; content: string; toolName: string | null; toolResult: string | null; createdAt: Date }) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      toolName: msg.toolName,
      toolResult: msg.toolResult,
      createdAt: msg.createdAt.toISOString(),
    })),
  );
});

/* ---------- POST — chat with tools ---------- */

const MAX_ITERATIONS = 10;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{ message: string }>(request);
  if (!body || !body.message?.trim()) {
    return fail("missing_message", "Message is required.");
  }

  const config = await getProviderConfig(userId);

  await prisma.chatMessage.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      role: "user",
      content: body.message,
    },
  });

  const recentMessages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  const contextMessages: ChatMessagePayload[] = [
    {
      role: "system",
      content:
        "You are Luxion OS, a helpful AI assistant for a self-hosted personal dashboard. " +
        "You have access to tools that let you interact with the user's system: homelab stats, notes, tasks, files, bookmarks, and analytics. " +
        "Use tools when appropriate, and always explain what you're doing. Be concise and helpful.",
    },
    ...recentMessages.map((msg: { role: string; content: string }) => ({
      role: msg.role as string,
      content: msg.content,
    })),
  ];

  const chatUrl = config.isOpenAI
    ? `${config.baseUrl}/chat/completions`
    : `${config.baseUrl}/api/chat`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  let iteration = 0;
  const toolCallMessages: ChatMessagePayload[] = [];

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    const toolDefs = tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages: [...contextMessages, ...toolCallMessages],
      tools: toolDefs,
      max_tokens: 2048,
    };

    if (config.isOpenAI) {
      requestBody.tool_choice = "auto";
    } else {
      requestBody.stream = false;
    }

    const response = await fetch(chatUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return fail("ai_error", `AI provider returned ${response.status}: ${errorText.slice(0, 200)}`, 502);
    }

    const data = (await response.json()) as Record<string, unknown>;

    let messageContent: string | null = null;
    let messageToolCalls: ToolCallPayload[] | undefined;

    if (config.isOpenAI) {
      const choice = (data as { choices?: unknown[] }).choices as Array<{
        message?: { content?: string | null; tool_calls?: ToolCallPayload[] };
      }> | undefined;
      const msg = choice?.[0]?.message;
      if (msg) {
        messageContent = msg.content ?? null;
        messageToolCalls = msg.tool_calls;
      }
    } else {
      const msg = (data as { message?: OllamaMessage }).message;
      if (msg) {
        messageContent = msg.content ?? null;
        if (msg.tool_calls) {
          messageToolCalls = msg.tool_calls.map((tc) => ({
            id: crypto.randomUUID(),
            type: "function" as const,
            function: {
              name: tc.function?.name ?? "",
              arguments: JSON.stringify(tc.function?.arguments ?? {}),
            },
          }));
        }
      }
    }

    if (!messageContent && !messageToolCalls) {
      return fail("ai_error", "No response from AI provider.", 502);
    }

    if (messageToolCalls && messageToolCalls.length > 0) {
      toolCallMessages.push({
        role: "assistant",
        content: null,
        tool_calls: messageToolCalls,
      });

      for (const toolCall of messageToolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
        } catch {
          // Keep empty args
        }

        const toolResult = await executeToolCall(userId, {
          name: toolCall.function.name,
          arguments: args,
        });

        const resultContent = toolResult.error
          ? `Error: ${toolResult.error}`
          : toolResult.result;

        toolCallMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: resultContent,
        });

        await prisma.chatMessage.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            role: "tool",
            content: resultContent,
            toolName: toolCall.function.name,
            toolResult: resultContent,
          },
        });
      }

      continue;
    }

    const assistantContent = messageContent ?? "No response.";

    await prisma.chatMessage.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        role: "assistant",
        content: assistantContent,
      },
    });

    return ok({
      message: assistantContent,
      toolCalls: toolCallMessages
        .filter((m) => m.role === "tool")
        .map((m) => ({ name: m.name ?? "", result: m.content ?? "" })),
    });
  }

  return fail("ai_loop", "AI reached maximum tool-call iterations.", 500);
});
