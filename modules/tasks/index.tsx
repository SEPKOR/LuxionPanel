"use client";

import { Calendar, Check, Flame, Loader2, Plus, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { uid } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

interface TaskData {
  id: string;
  title: string;
  priority: string;
  progress: number;
  due: string | null;
  done: boolean;
}

const habitSeeds = [
  { id: "habit_review", label: "Daily review", streak: 8, done: true },
  { id: "habit_backup", label: "Backup check", streak: 3, done: false },
  { id: "habit_read", label: "Read docs", streak: 5, done: true },
];

export function TasksModule({}: ModuleProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [habits, setHabits] = useLocalStorage("luxion:habits", habitSeeds);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/tasks");
      const payload = (await response.json()) as ApiResponse<TaskData[]>;
      if (payload.ok) {
        setTasks(payload.data);
      }
      setError(null);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const completion = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100);
  }, [tasks]);

  async function addTask() {
    const value = title.trim();
    if (!value) return;

    try {
      const response = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: uid("task"),
          title: value,
          priority: "Medium",
          progress: 0,
          due: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
          done: false,
        }),
      });
      const payload = (await response.json()) as ApiResponse<TaskData>;
      if (payload.ok) {
        setTasks((current) => [payload.data, ...current]);
        setTitle("");
      }
    } catch {
      setError("Failed to create task.");
    }
  }

  async function toggleDone(task: TaskData) {
    const updates = { done: !task.done, progress: task.done ? 50 : 100 };
    try {
      const response = await fetch("/api/v1/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, ...updates }),
      });
      const payload = (await response.json()) as ApiResponse<TaskData>;
      if (payload.ok) {
        setTasks((current) => current.map((item) => (item.id === task.id ? payload.data : item)));
      }
    } catch {
      setError("Failed to update task.");
    }
  }

  async function updateProgress(task: TaskData, progress: number) {
    try {
      const response = await fetch("/api/v1/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, progress }),
      });
      const payload = (await response.json()) as ApiResponse<TaskData>;
      if (payload.ok) {
        setTasks((current) => current.map((item) => (item.id === task.id ? payload.data : item)));
      }
    } catch {
      setError("Failed to update progress.");
    }
  }

  async function deleteTask(task: TaskData) {
    try {
      const response = await fetch(`/api/v1/tasks?id=${encodeURIComponent(task.id)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ deleted: boolean }>;
      if (payload.ok) {
        setTasks((current) => current.filter((item) => item.id !== task.id));
      }
    } catch {
      setError("Failed to delete task.");
    }
  }

  if (loading && !tasks.length) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-rose-200" aria-hidden />
              Progress
            </CardTitle>
            <Badge>{completion}% complete</Badge>
          </CardHeader>
          <CardContent>
            <Progress indicatorClassName="bg-rose-300" value={completion} />
          </CardContent>
        </Card>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <span>{error}</span>
            <Button onClick={() => void loadTasks()} size="sm" variant="ghost">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </Button>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void addTask()}
            placeholder="Add task"
            value={title}
          />
          <Button onClick={() => void addTask()} size="icon" title="Add task">
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="grid gap-3">
          {tasks.map((task) => (
            <Card className={task.done ? "opacity-60" : ""} key={task.id}>
              <CardContent className="grid gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => void toggleDone(task)}
                    type="button"
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${task.done ? "border-emerald-300/40 bg-emerald-300/20" : "border-white/10 bg-white/[0.05]"}`}>
                      {task.done ? <Check className="h-4 w-4 text-emerald-100" aria-hidden /> : null}
                    </span>
                    <span className="truncate text-sm font-medium text-white">{task.title}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge>{task.priority}</Badge>
                    {task.due ? (
                      <Badge className="gap-1">
                        <Calendar className="h-3 w-3" aria-hidden />
                        {task.due}
                      </Badge>
                    ) : null}
                    <Button onClick={() => void deleteTask(task)} size="icon" variant="ghost" title="Delete task">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_9rem] sm:items-center">
                  <Progress indicatorClassName="bg-rose-300" value={task.progress} />
                  <input
                    aria-label={`${task.title} progress`}
                    className="h-2 accent-rose-300"
                    max="100"
                    min="0"
                    onChange={(event) => void updateProgress(task, Number(event.target.value))}
                    type="range"
                    value={task.progress}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 content-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-200" aria-hidden />
              Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {habits.map((habit) => (
              <button
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-left transition hover:border-amber-300/30 hover:bg-white/[0.075]"
                key={habit.id}
                onClick={() => setHabits((current) => current.map((item) => (item.id === habit.id ? { ...item, done: !item.done, streak: item.done ? Math.max(0, item.streak - 1) : item.streak + 1 } : item)))}
                type="button"
              >
                <span className="text-sm font-medium text-white">{habit.label}</span>
                <span className="flex items-center gap-2 text-sm text-amber-100">
                  <Flame className="h-4 w-4" aria-hidden />
                  {habit.streak}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Mix</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["High", "Medium", "Low"].map((priority) => {
              const value = tasks.filter((task) => task.priority === priority).length;
              return (
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2" key={priority}>
                  <span className="text-sm text-zinc-300">{priority}</span>
                  <Badge>{value}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
