"use client";

import { Key, Loader2, RefreshCw, Shield, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
  language: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    notes: number;
    tasks: number;
    bookmarks: number;
    apiKeys: number;
  };
}

export function AdminModule({ userRole }: ModuleProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/users");
      const payload = (await response.json()) as ApiResponse<UserSummary[]>;
      if (payload.ok) {
        setUsers(payload.data);
        setError(null);
      } else {
        setError(payload.error?.message ?? "Failed to load users.");
      }
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function deleteUser(id: string) {
    if (!confirm("Delete this user and all their data? This cannot be undone.")) return;

    try {
      const response = await fetch(`/api/v1/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ deleted: boolean }>;
      if (payload.ok) {
        setUsers((current) => current.filter((u) => u.id !== id));
        setStatus("User deleted.");
      } else {
        setStatus(payload.error?.message ?? "Delete failed.");
      }
    } catch {
      setStatus("Delete failed.");
    }
  }

  async function resetPassword() {
    if (!resetUserId || !newPassword || newPassword.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch("/api/v1/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetUserId, newPassword }),
      });
      const payload = (await response.json()) as ApiResponse<{ reset: boolean; email: string }>;
      if (payload.ok) {
        setStatus(`Password reset for ${payload.data.email}`);
        setResetUserId(null);
        setNewPassword("");
      } else {
        setStatus(payload.error?.message ?? "Reset failed.");
      }
    } catch {
      setStatus("Reset failed.");
    } finally {
      setResetLoading(false);
    }
  }

  if (userRole !== "admin") {
    return (
      <Card>
        <CardContent className="grid min-h-44 place-items-center p-6">
          <div className="text-center">
            <Shield className="mx-auto h-10 w-10 text-zinc-500" aria-hidden />
            <p className="mt-3 text-sm text-zinc-400">Admin access required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-200" aria-hidden />
      </div>
    );
  }

  const totalUsers = users.length;
  const totalNotes = users.reduce((s, u) => s + (u._count?.notes ?? 0), 0);
  const totalTasks = users.reduce((s, u) => s + (u._count?.tasks ?? 0), 0);
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="grid gap-4">
      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: totalUsers.toString(), icon: Users, color: "text-cyan-200" },
          { label: "Admins", value: adminCount.toString(), icon: Shield, color: "text-emerald-200" },
          { label: "Notes", value: totalNotes.toString(), icon: Key, color: "text-amber-200" },
          { label: "Tasks", value: totalTasks.toString(), icon: Key, color: "text-rose-200" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} aria-hidden />
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Users</h2>
        <div className="flex items-center gap-2">
          {status ? (
            <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">{status}</Badge>
          ) : null}
          {error ? (
            <Badge className="border-red-400/20 bg-red-500/10 text-red-200">{error}</Badge>
          ) : null}
          <Button onClick={() => void loadUsers()} size="sm">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {/* User table */}
      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{user.name ?? user.email}</span>
                  <Badge className={user.role === "admin" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : ""}>
                    {user.role}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>{user.timezone}</span>
                  <span>·</span>
                  <span>{user.language}</span>
                  <span>·</span>
                  <span>Theme: {user.theme}</span>
                  <span>·</span>
                  <span>
                    N:{user._count?.notes ?? 0} T:{user._count?.tasks ?? 0} B:{user._count?.bookmarks ?? 0}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {resetUserId === user.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      className="h-8 w-40 text-xs"
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New password"
                      type="password"
                      value={newPassword}
                    />
                    <Button disabled={resetLoading} onClick={() => void resetPassword()} size="sm" variant="primary">
                      {resetLoading ? "..." : "Save"}
                    </Button>
                    <Button onClick={() => { setResetUserId(null); setNewPassword(""); }} size="sm" variant="ghost">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setResetUserId(user.id)} size="sm" variant="secondary">
                    <Key className="h-3.5 w-3.5" aria-hidden />
                    Reset PW
                  </Button>
                )}
                <Button onClick={() => void deleteUser(user.id)} size="sm" variant="danger">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
