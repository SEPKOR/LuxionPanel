import { getHomelabSnapshot } from "@/lib/system";
import { listFileRecords } from "@/lib/file-storage";
import { listFileRecords as listAllFiles } from "@/lib/file-storage";
import { prisma } from "@/lib/prisma";
import { enabledModules } from "@/lib/modules";
import { formatBytes } from "@/lib/utils";
import os from "node:os";

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolResult {
  toolName: string;
  result: string;
  error?: string;
}

export const tools: ToolDefinition[] = [
  {
    name: "get_homelab_snapshot",
    description: "Get the current system resource usage: CPU percentage, RAM percentage, disk usage, network interfaces, Docker containers running, and ping latency to configured targets.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_notes",
    description: "Search the user's notes by keyword. Returns matching notes with their IDs, titles, categories, and preview snippets.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword to find in note titles, bodies, categories, and tags" },
      },
      required: ["query"],
    },
  },
  {
    name: "read_note",
    description: "Read the full content of a specific note by its ID.",
    parameters: {
      type: "object",
      properties: {
        noteId: { type: "string", description: "The ID of the note to read" },
      },
      required: ["noteId"],
    },
  },
  {
    name: "create_note",
    description: "Create a new note for the user.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the note" },
        body: { type: "string", description: "Markdown body content" },
        category: { type: "string", description: "Category (e.g. Operations, Infrastructure, etc.)" },
        tags: { type: "array", items: { type: "string" }, description: "List of tags" },
      },
      required: ["title", "body"],
    },
  },
  {
    name: "list_tasks",
    description: "List the user's tasks. Can optionally filter by completion status.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["all", "done", "pending"], description: "Filter tasks: all, done, or pending" },
      },
      required: [],
    },
  },
  {
    name: "create_task",
    description: "Create a new task for the user.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        priority: { type: "string", enum: ["High", "Medium", "Low"], description: "Task priority" },
        due: { type: "string", description: "Due date in YYYY-MM-DD format" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update a task's status, progress, or mark it as done.",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "Task ID to update" },
        done: { type: "boolean", description: "Mark task as done or not done" },
        progress: { type: "number", description: "Progress percentage (0-100)" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "list_files",
    description: "List all files the user has uploaded, with names, sizes, types, and folders.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_analytics",
    description: "Get system analytics: storage usage, module counts, uptime, and file statistics.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_bookmarks",
    description: "Search the user's bookmarks by keyword in title, URL, or category.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword" },
      },
      required: ["query"],
    },
  },
];

type ExecutorFn = (args: Record<string, unknown>, userId: string) => Promise<string>;

export const toolExecutors: Record<string, ExecutorFn> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get_homelab_snapshot(_args, _userId) {
    const snap = await getHomelabSnapshot();
    const lines: string[] = [
      `CPU: ${snap.cpu}%`,
      `RAM: ${snap.ram}%`,
      `Disk: ${snap.disk}%`,
      `Network: ${snap.network.interfaces} interfaces, ${snap.network.addresses} addresses`,
      `Uptime: ${Math.floor(snap.uptimeSeconds / 3600)}h ${Math.floor((snap.uptimeSeconds % 3600) / 60)}m`,
      `Docker containers visible: ${snap.docker.length}`,
      `Pings: ${snap.pings.map((p) => `${p.target}: ${p.online ? `${p.latencyMs}ms` : "offline"}`).join(", ")}`,
    ];
    return lines.join("\n");
  },

  async search_notes(args, userId) {
    const query = String(args.query ?? "");
    const notes = await prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { body: { contains: query } },
          { category: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    if (!notes.length) return `No notes found matching "${query}".`;

    return notes
      .map((n: { id: string; title: string; category: string; body: string; pinned: boolean }) => `[${n.id}] ${n.title} (${n.category}) — ${n.body.slice(0, 120)}${n.body.length > 120 ? "..." : ""}`)
      .join("\n\n");
  },

  async read_note(args, userId) {
    const id = String(args.noteId ?? "");
    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) return `Note ${id} not found.`;
    return `# ${note.title}\nCategory: ${note.category}\nTags: ${JSON.parse(note.tags).join(", ")}\nPinned: ${note.pinned}\n\n${note.body}`;
  },

  async create_note(args, userId) {
    const title = String(args.title ?? "Untitled");
    const body = String(args.body ?? "");
    const category = String(args.category ?? "AI Generated");
    const tags = Array.isArray(args.tags) ? args.tags.map(String) : ["ai"];

    const note = await prisma.note.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        title,
        body,
        category,
        tags: JSON.stringify(tags),
        pinned: false,
      },
    });

    return `Note created successfully. ID: ${note.id}, Title: "${note.title}"`;
  },

  async list_tasks(args, userId) {
    const status = String(args.status ?? "all");
    const where: Record<string, unknown> = { userId };
    if (status === "done") where.done = true;
    if (status === "pending") where.done = false;

    const tasks = await prisma.task.findMany({
      where,
      take: 15,
      orderBy: { createdAt: "desc" },
    });

    if (!tasks.length) return "No tasks found.";

    return tasks
      .map((t: { id: string; title: string; priority: string; progress: number; done: boolean; due: string | null }) => `[${t.id}] ${t.title} | ${t.priority} | ${t.progress}% ${t.done ? "✓ Done" : ""} ${t.due ? `| Due: ${t.due}` : ""}`)
      .join("\n");
  },

  async create_task(args, userId) {
    const title = String(args.title ?? "New task");
    const priority = String(args.priority ?? "Medium");
    const due = args.due ? String(args.due) : null;

    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        title,
        priority,
        progress: 0,
        due,
        done: false,
      },
    });

    return `Task created. ID: ${task.id}, Title: "${task.title}", Priority: ${task.priority}${due ? `, Due: ${due}` : ""}`;
  },

  async update_task(args, userId) {
    const id = String(args.taskId ?? "");
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return `Task ${id} not found.`;

    const data: Record<string, unknown> = {};
    if (args.done !== undefined) data.done = Boolean(args.done);
    if (args.progress !== undefined) data.progress = Math.max(0, Math.min(100, Number(args.progress)));

    if (!Object.keys(data).length) return "No updates provided.";

    await prisma.task.update({ where: { id }, data });
    return `Task ${id} updated: ${JSON.stringify(data)}`;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list_files(_args, _userId) {
    const files = await listFileRecords();
    if (!files.length) return "No files uploaded.";
    return files
      .map((f) => `${f.name} (${f.folder || "inbox"}) — ${formatBytes(f.size)} — ${f.type}`)
      .join("\n");
  },

  async get_analytics(_args, userId) {
    const files = await listAllFiles();
    const totalNotes = await prisma.note.count({ where: { userId } });
    const totalTasks = await prisma.task.count({ where: { userId } });
    const storageBytes = files.reduce((sum, f) => sum + f.size, 0);
    const uptime = Math.round(os.uptime());

    return [
      `Storage used: ${formatBytes(storageBytes)}`,
      `Files: ${files.length}`,
      `Notes: ${totalNotes}`,
      `Tasks: ${totalTasks}`,
      `Active modules: ${enabledModules.length}`,
      `System uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    ].join("\n");
  },

  async search_bookmarks(args, userId) {
    const query = String(args.query ?? "");
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { url: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    if (!bookmarks.length) return `No bookmarks found matching "${query}".`;

    return bookmarks
      .map((b: { id: string; title: string; url: string; category: string }) => `[${b.id}] ${b.title} — ${b.url} (${b.category})`)
      .join("\n");
  },
};

export async function executeToolCall(
  userId: string,
  call: ToolCall,
): Promise<ToolResult> {
  const executor = toolExecutors[call.name];
  if (!executor) {
    return {
      toolName: call.name,
      result: "",
      error: `Unknown tool: ${call.name}`,
    };
  }

  try {
    const result = await executor(call.arguments, userId);
    return { toolName: call.name, result };
  } catch (error) {
    return {
      toolName: call.name,
      result: "",
      error: error instanceof Error ? error.message : "Tool execution failed.",
    };
  }
}
