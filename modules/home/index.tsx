"use client";

import { CalendarDays, Clock3, CloudSun, Search, Star, TrendingUp } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInterval } from "@/hooks/use-interval";
import { favoriteShortcuts, recentActivities } from "@/lib/sample-data";
import type { ModuleProps } from "@/types/module-props";

const statColors: Record<string, string> = {
  amber: "text-amber-200",
  rose: "text-rose-200",
  sky: "text-sky-200",
  emerald: "text-emerald-200",
};

const homeStats = [
  ["Notes", "12", "amber"],
  ["Tasks", "8", "rose"],
  ["Files", "126", "sky"],
  ["Modules", "13", "emerald"],
] as const;

const ClockCard = memo(function ClockCard({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(() => new Date());

  useInterval(() => setNow(new Date()), 1000);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(now.getHours())]);

  const timeTz = timezone && timezone !== "UTC" ? timezone : undefined;

  const time = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timeTz,
      }).format(now);
    } catch {
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now);
    }
  }, [now, timeTz]);

  const date = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: timeTz,
      }).format(now);
    } catch {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.toDateString(), timeTz]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">{greeting}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Your local command surface is online, synced, and ready for the next useful thing.
          </p>
        </div>
        <div className="grid min-w-52 gap-3 rounded-lg border border-white/10 bg-zinc-950/35 p-4">
          <div className="flex items-center gap-3 text-zinc-300">
            <Clock3 className="h-4 w-4 text-cyan-200" aria-hidden />
            <span className="font-mono text-2xl text-white">{time}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <CalendarDays className="h-4 w-4 text-emerald-200" aria-hidden />
            {date}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export const HomeModule = memo(function HomeModule({ openModule, settings }: ModuleProps) {
  const handleSearchClick = useCallback(() => {
    openModule("dashboard");
  }, [openModule]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="grid gap-4">
        <ClockCard timezone={settings.timezone} />

        <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-0">
          <Badge className="mb-0 mt-3 w-fit border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            {settings.weatherLocation}
          </Badge>
        </div>

        <button
          className="flex h-14 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-left text-sm text-zinc-400 shadow-lg shadow-black/20 transition hover:border-cyan-300/30 hover:bg-white/[0.09]"
          onClick={handleSearchClick}
          type="button"
        >
          <Search className="h-5 w-5 text-cyan-200" aria-hidden />
          <span className="min-w-0 flex-1">Search notes, tasks, files, bookmarks, and music</span>
        </button>

        <div className="grid gap-4 md:grid-cols-4">
          {homeStats.map(([label, value, accent]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className={`mt-3 text-3xl font-semibold ${statColors[accent]}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-amber-200" aria-hidden />
              Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-semibold text-white">27C</p>
                <p className="mt-2 text-sm text-zinc-400">Light clouds, low wind</p>
              </div>
              <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">Local</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-200" aria-hidden />
              Recent
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recentActivities.map((activity) => (
              <div key={activity} className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-zinc-300">
                {activity}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-200" aria-hidden />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {favoriteShortcuts.map((shortcut) => (
              <Button key={shortcut.title} onClick={() => window.open(shortcut.url, "_blank", "noopener,noreferrer")}>
                {shortcut.title}
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
});
