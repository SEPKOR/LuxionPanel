"use client";

import { Bot, Key, Loader2, Plus, Send, Sparkles, Trash2, User, Wrench } from "lucide-react";
import { memo, useCallback, useEffect, useReducer, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { uid } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

/* ---------- types ---------- */

interface ChatMessageUI {
  id: string;
  role: string;
  content: string;
  toolName?: string;
  toolResult?: string;
  createdAt?: string;
}

interface ApiKeyInfo {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  isDefault: boolean;
  maskedKey: string;
}

interface ToolCallInfo {
  name: string;
  result: string;
}

interface ChatState {
  messages: ChatMessageUI[];
  loading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; message: ChatMessageUI }
  | { type: "ADD_AI_MESSAGES"; messages: ChatMessageUI[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_MESSAGES"; messages: ChatMessageUI[] };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "ADD_AI_MESSAGES":
      return { ...state, messages: [...state.messages, ...action.messages] };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    default:
      return state;
  }
}

const WELCOME_MESSAGE: ChatMessageUI = {
  id: "assistant_welcome",
  role: "assistant",
  content: "Luxion AI is ready. I can check your homelab, search notes, manage tasks, list files, and more. Ask me anything!",
};

const SUGGESTIONS = [
  { prompt: "Check my homelab status and resources" },
  { prompt: "Create a task to review backups" },
  { prompt: "Search notes for security" },
  { prompt: "What files do I have uploaded?" },
  { prompt: "Show me system analytics" },
  { prompt: "Find bookmarks about development" },
];

/* ---------- ChatMessage component ---------- */

const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  expanded,
  onToggleExpand,
}: {
  message: ChatMessageUI;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  const handleToggle = useCallback(() => {
    onToggleExpand(message.id);
  }, [onToggleExpand, message.id]);

  return (
    <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`grid max-w-[82%] gap-2 rounded-lg border p-3 ${
          message.role === "tool"
            ? "border-amber-300/20 bg-amber-300/5"
            : message.role === "user"
              ? "border-cyan-300/20 bg-cyan-300/10"
              : "border-white/10 bg-white/[0.055]"
        }`}
      >
        <div className="flex items-center gap-2 text-xs uppercase text-zinc-500">
          {message.role === "user" ? (
            <User className="h-3.5 w-3.5" aria-hidden />
          ) : message.role === "tool" ? (
            <Wrench className="h-3.5 w-3.5 text-amber-200" aria-hidden />
          ) : (
            <Bot className="h-3.5 w-3.5" aria-hidden />
          )}
          {message.role === "tool" && message.toolName
            ? `Tool: ${message.toolName}`
            : message.role}
        </div>
        {message.role === "tool" ? (
          <button className="text-left text-sm leading-5 text-zinc-400 hover:text-zinc-200" onClick={handleToggle} type="button">
            {expanded
              ? message.content
              : `${message.content.slice(0, 80)}${message.content.length > 80 ? "..." : ""}`}
            <span className="ml-2 text-xs text-zinc-600">{expanded ? "Collapse" : "Expand"}</span>
          </button>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.content}</p>
        )}
      </div>
    </div>
  );
});

/* ---------- InputArea component ---------- */

const ChatInputArea = memo(function ChatInputArea({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <Textarea
        className="min-h-20"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Luxion AI — I can check your system, manage notes/tasks, and more"
        value={value}
      />
      <Button className="h-full min-h-20" disabled={disabled} onClick={handleSend}>
        <Send className="h-4 w-4" aria-hidden />
        Send
      </Button>
    </div>
  );
});

/* ---------- ApiKeyCard component ---------- */

const ApiKeyCard = memo(function ApiKeyCard({
  apiKey,
  onSetDefault,
  onDelete,
}: {
  apiKey: ApiKeyInfo;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{apiKey.label}</span>
        <div className="flex items-center gap-1">
          <Badge className="text-[10px]">{apiKey.model}</Badge>
          {apiKey.isDefault ? (
            <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 text-[10px]">Default</Badge>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        {apiKey.baseUrl || "Ollama local"} | Key: {apiKey.maskedKey}
      </p>
      <div className="flex gap-2">
        {!apiKey.isDefault ? (
          <Button onClick={() => onSetDefault(apiKey.id)} size="sm" variant="ghost">
            Set default
          </Button>
        ) : null}
        <Button onClick={() => onDelete(apiKey.id)} size="sm" variant="danger">
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Remove
        </Button>
      </div>
    </div>
  );
});

/* ---------- Main AiModule ---------- */

export function AiModule({}: ModuleProps) {
  const [chat, dispatch] = useReducer(chatReducer, { messages: [], loading: false, error: null });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyUrl, setNewKeyUrl] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyModel, setNewKeyModel] = useState("gpt-4o-mini");
  const [keyLoading, setKeyLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/ai/chat", { method: "GET" });
      if (response.status !== 404) {
        const payload = (await response.json()) as ApiResponse<ChatMessageUI[]>;
        if (payload.ok) {
          dispatch({ type: "SET_MESSAGES", messages: payload.data.length ? payload.data : [WELCOME_MESSAGE] });
        }
      } else {
        dispatch({ type: "SET_MESSAGES", messages: [WELCOME_MESSAGE] });
      }
    } catch {
      dispatch({ type: "SET_MESSAGES", messages: [WELCOME_MESSAGE] });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadApiKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/user/api-keys");
      const payload = (await response.json()) as ApiResponse<ApiKeyInfo[]>;
      if (payload.ok) setApiKeys(payload.data);
    } catch {
      // No keys
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    void loadApiKeys();
  }, [loadHistory, loadApiKeys]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMessage: ChatMessageUI = { id: uid("msg"), role: "user", content: text };
      dispatch({ type: "ADD_USER_MESSAGE", message: userMessage });
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });

      try {
        const response = await fetch("/api/v1/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        const payload = (await response.json()) as ApiResponse<{ message: string; toolCalls?: ToolCallInfo[] }>;
        const newMessages: ChatMessageUI[] = [];

        if (payload.ok && payload.data.toolCalls) {
          for (const tc of payload.data.toolCalls) {
            newMessages.push({ id: uid("tool"), role: "tool", content: tc.result, toolName: tc.name, toolResult: tc.result });
          }
        }

        newMessages.push({
          id: uid("msg"),
          role: "assistant",
          content: payload.ok ? payload.data.message : payload.error?.message ?? "AI request failed.",
        });

        dispatch({ type: "ADD_AI_MESSAGES", messages: newMessages });
      } catch {
        dispatch({ type: "SET_ERROR", error: "Connection failed. Check your AI provider settings." });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [],
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedTools((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSetDefault = useCallback(async (id: string) => {
    try {
      const response = await fetch("/api/v1/user/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      const payload = (await response.json()) as ApiResponse<ApiKeyInfo>;
      if (payload.ok) {
        setApiKeys((current) => current.map((key) => ({ ...key, isDefault: key.id === id })));
      }
    } catch {
      dispatch({ type: "SET_ERROR", error: "Failed to update API key." });
    }
  }, []);

  const handleDeleteKey = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/v1/user/api-keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ deleted: boolean }>;
      if (payload.ok) setApiKeys((current) => current.filter((key) => key.id !== id));
    } catch {
      dispatch({ type: "SET_ERROR", error: "Failed to delete API key." });
    }
  }, []);

  const handleAddKey = useCallback(async () => {
    if (!newKeyLabel || !newKeyValue) return;
    setKeyLoading(true);
    try {
      const response = await fetch("/api/v1/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newKeyLabel,
          provider: newKeyUrl ? "openai" : "ollama",
          baseUrl: newKeyUrl,
          apiKey: newKeyValue,
          model: newKeyModel,
          isDefault: !apiKeys.length,
        }),
      });
      const payload = (await response.json()) as ApiResponse<ApiKeyInfo>;
      if (payload.ok) {
        setApiKeys((current) => [...current, payload.data]);
        setNewKeyLabel("");
        setNewKeyUrl("");
        setNewKeyValue("");
        setNewKeyModel("gpt-4o-mini");
        setShowKeyManager(false);
      }
    } catch {
      dispatch({ type: "SET_ERROR", error: "Failed to save API key." });
    } finally {
      setKeyLoading(false);
    }
  }, [newKeyLabel, newKeyUrl, newKeyValue, newKeyModel, apiKeys.length]);

  const handleSuggestionClick = useCallback((prompt: string) => {
    // Will be passed to input area indirectly — simplifies flow
    // The suggestions just set input but InputArea manages its own state now.
    // We need a different approach: track suggestion clicks separately
    const userMessage: ChatMessageUI = { id: uid("msg"), role: "user", content: prompt };
    dispatch({ type: "ADD_USER_MESSAGE", message: userMessage });
    dispatch({ type: "SET_LOADING", loading: true });
    // Kick off send immediately for suggestions
    void (async () => {
      try {
        const response = await fetch("/api/v1/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt }),
        });
        const payload = (await response.json()) as ApiResponse<{ message: string; toolCalls?: ToolCallInfo[] }>;
        const newMessages: ChatMessageUI[] = [];
        if (payload.ok && payload.data.toolCalls) {
          for (const tc of payload.data.toolCalls) {
            newMessages.push({ id: uid("tool"), role: "tool", content: tc.result, toolName: tc.name, toolResult: tc.result });
          }
        }
        newMessages.push({
          id: uid("msg"),
          role: "assistant",
          content: payload.ok ? payload.data.message : payload.error?.message ?? "Failed",
        });
        dispatch({ type: "ADD_AI_MESSAGES", messages: newMessages });
      } catch {
        dispatch({ type: "SET_ERROR", error: "Connection failed." });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    })();
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.42fr]">
      <Card className="min-h-[70vh]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-200" aria-hidden />
            AI
          </CardTitle>
          <div className="flex items-center gap-2">
            {apiKeys.length > 0 ? (
              <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                {apiKeys.find((k) => k.isDefault)?.label ?? "API ready"}
              </Badge>
            ) : (
              <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">No API key</Badge>
            )}
            <Badge>{chat.loading ? "Thinking" : "Ready"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid h-[calc(70vh-4rem)] grid-rows-[1fr_auto] gap-4">
          <div className="thin-scrollbar grid content-start gap-3 overflow-auto pr-1">
            {historyLoading ? (
              <div className="grid py-12 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-violet-200" aria-hidden />
              </div>
            ) : null}
            {chat.error ? (
              <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{chat.error}</div>
            ) : null}
            {chat.messages.map((message) => (
              <ChatMessageBubble
                expanded={expandedTools.has(message.id)}
                key={message.id}
                message={message}
                onToggleExpand={handleToggleExpand}
              />
            ))}
            {chat.loading ? (
              <div className="flex justify-start">
                <div className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-200" aria-hidden />
                </div>
              </div>
            ) : null}
          </div>
          <ChatInputArea disabled={chat.loading} onSend={handleSend} />
        </CardContent>
      </Card>

      <section className="grid gap-4 content-start">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4 text-violet-200" aria-hidden />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {apiKeys.map((key) => (
              <ApiKeyCard apiKey={key} key={key.id} onDelete={handleDeleteKey} onSetDefault={handleSetDefault} />
            ))}

            {showKeyManager ? (
              <div className="grid gap-2 rounded-lg border border-violet-300/20 bg-violet-300/5 p-3">
                <Input onChange={(e) => setNewKeyLabel(e.target.value)} placeholder="Label (e.g. My OpenAI)" value={newKeyLabel} />
                <Input onChange={(e) => setNewKeyUrl(e.target.value)} placeholder="Base URL (leave empty for Ollama)" value={newKeyUrl} />
                <Input onChange={(e) => setNewKeyValue(e.target.value)} placeholder="API key" type="password" value={newKeyValue} />
                <Input onChange={(e) => setNewKeyModel(e.target.value)} placeholder="Model (e.g. gpt-4o-mini)" value={newKeyModel} />
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={keyLoading} onClick={handleAddKey}>
                    <Plus className="h-4 w-4" aria-hidden />
                    {keyLoading ? "Saving..." : "Save Key"}
                  </Button>
                  <Button onClick={() => setShowKeyManager(false)} variant="ghost" size="sm">Cancel</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowKeyManager(true)} variant="secondary" size="sm">
                <Plus className="h-4 w-4" aria-hidden /> Add API Key
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {SUGGESTIONS.map((item) => (
              <button
                className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left text-sm font-medium text-white transition hover:border-violet-300/30 hover:bg-violet-300/10"
                key={item.prompt}
                onClick={() => handleSuggestionClick(item.prompt)}
                type="button"
              >
                {item.prompt}
              </button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
