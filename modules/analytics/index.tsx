"use client";

import { ChartNoAxesCombined, Database, FileText, FolderOpen, Timer, ToggleRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { enabledModules } from "@/lib/modules";
import { formatBytes } from "@/lib/utils";
import type { AnalyticsSnapshot, ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

const fallback: AnalyticsSnapshot = {
  storageBytes: 0,
  totalNotes: 0,
  totalFiles: 0,
  totalTasks: 0,
  activeModules: enabledModules.length,
  uptimeSeconds: 0,
};

function uptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function AnalyticsModule({}: ModuleProps) {
  const [stats, setStats] = useState(fallback);

  const loadStats = useCallback(async () => {
    const response = await fetch("/api/v1/stats", { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse<AnalyticsSnapshot>;
    if (payload.ok) {
      setStats(payload.data);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const cards = [
    { label: "Storage", value: formatBytes(stats.storageBytes), icon: Database, color: "text-cyan-200" },
    { label: "Notes", value: stats.totalNotes.toString(), icon: FileText, color: "text-amber-200" },
    { label: "Files", value: stats.totalFiles.toString(), icon: FolderOpen, color: "text-sky-200" },
    { label: "Modules", value: stats.activeModules.toString(), icon: ToggleRight, color: "text-emerald-200" },
    { label: "Uptime", value: uptime(stats.uptimeSeconds), icon: Timer, color: "text-rose-200" },
  ];

  const chart = [
    { label: "Notes", value: Math.min(100, stats.totalNotes * 8), color: "bg-amber-300" },
    { label: "Tasks", value: Math.min(100, stats.totalTasks * 10), color: "bg-rose-300" },
    { label: "Files", value: Math.min(100, stats.totalFiles * 6), color: "bg-sky-300" },
    { label: "Modules", value: Math.min(100, stats.activeModules * 7), color: "bg-emerald-300" },
  ];

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.color}`} aria-hidden />
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartNoAxesCombined className="h-4 w-4 text-teal-200" aria-hidden />
              Charts
            </CardTitle>
            <Badge>Live</Badge>
          </CardHeader>
          <CardContent className="grid gap-5">
            {chart.map((item) => (
              <div className="grid gap-2" key={item.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">{item.label}</span>
                  <span className="font-mono text-zinc-500">{item.value}%</span>
                </div>
                <Progress indicatorClassName={item.color} value={item.value} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module Footprint</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {enabledModules.map((module) => (
              <div className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-zinc-300" key={module.id}>
                {module.name}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
