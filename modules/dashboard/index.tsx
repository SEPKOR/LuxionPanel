"use client";

import { Activity, ArrowRight, CheckCircle2, CircleDot, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { enabledModules } from "@/lib/modules";
import type { ModuleProps } from "@/types/module-props";

export function DashboardModule({ openModule }: ModuleProps) {
  const priorities = [
    { label: "System health", value: 92, moduleId: "homelab" as const },
    { label: "Task completion", value: 64, moduleId: "tasks" as const },
    { label: "Backup coverage", value: 78, moduleId: "settings" as const },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-200" aria-hidden />
              Command Center
            </CardTitle>
            <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">Healthy</Badge>
          </CardHeader>
          <CardContent className="grid gap-4">
            {priorities.map((priority) => (
              <button
                className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.075]"
                key={priority.label}
                onClick={() => openModule(priority.moduleId)}
                type="button"
              >
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{priority.label}</span>
                  <span className="font-mono text-zinc-500">{priority.value}%</span>
                </div>
                <Progress value={priority.value} />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-200" aria-hidden />
              Runbook
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["Review failed pings", "Export backup", "Clear completed tasks"].map((item, index) => (
              <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2" key={item}>
                {index === 0 ? (
                  <CircleDot className="h-4 w-4 text-amber-200" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" aria-hidden />
                )}
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <Badge>{enabledModules.length} active</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {enabledModules.map((module) => (
            <button
              className="group flex min-h-24 items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.075]"
              key={module.id}
              onClick={() => openModule(module.id)}
              type="button"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{module.name}</span>
                  <Badge className="h-5 px-1.5 text-[10px] uppercase">{module.status}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{module.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" aria-hidden />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
