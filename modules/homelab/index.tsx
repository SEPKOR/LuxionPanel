"use client";

import { Container, Cpu, Database, HardDrive, Network, RefreshCw, Wifi, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useInterval } from "@/hooks/use-interval";
import type { ApiResponse, HomelabSnapshot } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

const initialSnapshot: HomelabSnapshot = {
  cpu: 0,
  ram: 0,
  disk: 0,
  network: { interfaces: 0, addresses: 0 },
  uptimeSeconds: 0,
  docker: [],
  pings: [],
  updatedAt: new Date().toISOString(),
};

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
            {label}
          </div>
          <span className="font-mono text-sm text-zinc-400">{Math.round(value)}%</span>
        </div>
        <Progress className="mt-4" indicatorClassName={tone.replace("text-", "bg-")} value={value} />
        <p className="mt-3 text-xs text-zinc-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function HomelabModule({}: ModuleProps) {
  const [snapshot, setSnapshot] = useState<HomelabSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/homelab", { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<HomelabSnapshot>;
      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to load homelab data");
      }
      setSnapshot(payload.data);
      setError(null);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Unable to load homelab data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useInterval(() => {
    void loadSnapshot();
  }, 2500);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Homelab</h2>
          <p className="mt-1 text-sm text-zinc-500">Updated {new Date(snapshot.updatedAt).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {error ? <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-100">{error}</Badge> : null}
          <Button onClick={() => void loadSnapshot()} size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Load average proxy from host OS" icon={Cpu} label="CPU" tone="text-cyan-200" value={snapshot.cpu} />
        <MetricCard detail="Process and system memory pressure" icon={Database} label="RAM" tone="text-emerald-200" value={snapshot.ram} />
        <MetricCard detail="Storage volume usage percentage" icon={HardDrive} label="Disk" tone="text-amber-200" value={snapshot.disk} />
        <MetricCard detail={`${snapshot.network.interfaces} interfaces, ${snapshot.network.addresses} addresses`} icon={Network} label="Network" tone="text-sky-200" value={Math.min(100, snapshot.network.addresses * 18)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-200" aria-hidden />
              Ping Monitor
            </CardTitle>
            <Badge>{formatUptime(snapshot.uptimeSeconds)}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3">
            {snapshot.pings.length ? (
              snapshot.pings.map((ping) => (
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2" key={ping.target}>
                  <span className="truncate text-sm text-zinc-300">{ping.target}</span>
                  <Badge className={ping.online ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-red-300/20 bg-red-300/10 text-red-100"}>
                    {ping.latencyMs === null ? "offline" : `${ping.latencyMs}ms`}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No ping targets configured.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Container className="h-4 w-4 text-cyan-200" aria-hidden />
              Docker Containers
            </CardTitle>
            <Badge>{snapshot.docker.length} visible</Badge>
          </CardHeader>
          <CardContent className="grid gap-3">
            {snapshot.docker.length ? (
              snapshot.docker.map((container) => (
                <div className="grid gap-1 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2" key={container.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-white">{container.name}</span>
                    <Badge>{container.status}</Badge>
                  </div>
                  <span className="truncate text-xs text-zinc-500">{container.image}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Docker visibility is disabled or no containers are running.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
