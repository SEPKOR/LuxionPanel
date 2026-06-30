"use client";

import { Clock, Download, Languages, Loader2, Moon, RotateCcw, Save, ToggleRight, Upload, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { modules } from "@/lib/modules";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

interface UserProfileData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
  language: string;
  theme: string;
  animations: boolean;
  compactMode: boolean;
  weatherLocation: string;
  modulePreferences: string | null;
  createdAt: string;
}

interface ModulePref {
  enabled: boolean;
  pingTargets?: string;
}

const timezones = [
  { label: "UTC", value: "UTC" },
  { label: "US Eastern (EST/EDT)", value: "America/New_York" },
  { label: "US Central (CST/CDT)", value: "America/Chicago" },
  { label: "US Mountain (MST/MDT)", value: "America/Denver" },
  { label: "US Pacific (PST/PDT)", value: "America/Los_Angeles" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Berlin (CET/CEST)", value: "Europe/Berlin" },
  { label: "Moscow (MSK)", value: "Europe/Moscow" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "Mumbai (IST)", value: "Asia/Kolkata" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Jakarta (WIB)", value: "Asia/Jakarta" },
  { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney" },
  { label: "Auckland (NZST/NZDT)", value: "Pacific/Auckland" },
];

export function SettingsModule({ settings, setSettings }: ModuleProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [modulePrefs, setModulePrefs] = useState<Record<string, ModulePref>>({});
  const [pingInput, setPingInput] = useState("");
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/user/profile");
      const payload = (await response.json()) as ApiResponse<UserProfileData>;
      if (payload.ok && payload.data) {
        setProfile(payload.data);
        setSettings({
          theme: payload.data.theme as "dark" | "light",
          language: payload.data.language as "en" | "id",
          animations: payload.data.animations,
          autoBackup: false,
          compactMode: payload.data.compactMode,
          weatherLocation: payload.data.weatherLocation,
          timezone: payload.data.timezone ?? "UTC",
        });
        const prefs = payload.data.modulePreferences
          ? (JSON.parse(payload.data.modulePreferences) as Record<string, ModulePref>)
          : {};
        setModulePrefs(prefs);
        setPingInput(prefs.homelab?.pingTargets ?? "");
      }
    } catch {
      setStatus("Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [setSettings]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function scheduleProfileSave(patch: Record<string, unknown>) {
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(() => {
      void saveProfile(patch);
    }, 400);
    setSaveTimer(timer);
  }

  async function saveProfile(patch: Record<string, unknown>) {
    try {
      const response = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as ApiResponse<UserProfileData>;
      if (payload.ok) {
        setStatus("Saved.");
      } else {
        setStatus("Save failed.");
      }
    } catch {
      setStatus("Save failed.");
    }
  }

  async function exportBackup() {
    setStatus("Exporting...");
    const response = await fetch("/api/v1/backup", { method: "POST" });
    const payload = (await response.json()) as ApiResponse<{ path: string; exportedAt: string }>;
    setStatus(payload.ok ? `Exported ${payload.data.exportedAt}` : payload.error?.message ?? "Export failed");
  }

  async function importBackup(file: File) {
    setStatus("Importing...");
    const text = await file.text();
    const response = await fetch("/api/v1/backup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: text,
    });
    const payload = (await response.json()) as ApiResponse<{ imported: boolean }>;
    setStatus(payload.ok ? "Import completed" : payload.error?.message ?? "Import failed");
  }

  function toggleModule(moduleId: string) {
    setModulePrefs((current) => {
      const next = { ...current };
      if (!next[moduleId]) {
        next[moduleId] = { enabled: true };
      }
      next[moduleId] = {
        ...next[moduleId],
        enabled: !next[moduleId].enabled,
      };
      scheduleProfileSave({ modulePreferences: JSON.stringify(next) });
      return next;
    });
  }

  function savePingTargets() {
    setModulePrefs((current) => {
      const next = { ...current };
      if (!next.homelab) next.homelab = { enabled: true };
      next.homelab.pingTargets = pingInput;
      scheduleProfileSave({ modulePreferences: JSON.stringify(next) });
      return next;
    });
    setStatus("Ping targets saved.");
  }

  if (profileLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      {/* Left column */}
      <section className="grid gap-4 content-start">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-cyan-200" aria-hidden />
              Theme
            </CardTitle>
            <Badge>{settings.theme}</Badge>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3">
              <span className="text-sm text-zinc-300">Dark mode</span>
              <Switch
                checked={settings.theme === "dark"}
                label="Dark mode"
                onCheckedChange={(checked) => {
                  setSettings((c) => ({ ...c, theme: checked ? "dark" : "light" }));
                  scheduleProfileSave({ theme: checked ? "dark" : "light" });
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3">
              <span className="text-sm text-zinc-300">Animations</span>
              <Switch
                checked={settings.animations}
                label="Animations"
                onCheckedChange={(checked) => {
                  setSettings((c) => ({ ...c, animations: checked }));
                  scheduleProfileSave({ animations: checked });
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3">
              <span className="text-sm text-zinc-300">Compact mode</span>
              <Switch
                checked={settings.compactMode}
                label="Compact mode"
                onCheckedChange={(checked) => {
                  setSettings((c) => ({ ...c, compactMode: checked }));
                  scheduleProfileSave({ compactMode: checked });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-amber-200" aria-hidden />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <select
              className="h-10 rounded-md border border-white/10 bg-zinc-950/50 px-3 text-sm text-white outline-none"
              onChange={(event) => {
                setSettings((c) => ({ ...c, language: event.target.value as "en" | "id" }));
                scheduleProfileSave({ language: event.target.value });
              }}
              value={settings.language}
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>

            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Clock className="h-4 w-4" aria-hidden />
              Timezone
            </div>
            <select
              className="h-10 rounded-md border border-white/10 bg-zinc-950/50 px-3 text-sm text-white outline-none"
              onChange={(event) => {
                scheduleProfileSave({ timezone: event.target.value });
              }}
              value={profile?.timezone ?? "UTC"}
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>

            <Input
              onChange={(event) => {
                setSettings((c) => ({ ...c, weatherLocation: event.target.value }));
                scheduleProfileSave({ weatherLocation: event.target.value });
              }}
              placeholder="Weather location"
              value={settings.weatherLocation}
            />
          </CardContent>
        </Card>

        {/* Module preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleRight className="h-4 w-4 text-emerald-200" aria-hidden />
              Modules
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
            {modules.map((mod) => (
              <div
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-3"
                key={mod.id}
              >
                <div>
                  <span className="text-sm font-medium text-white">{mod.name}</span>
                  <span className="ml-2 text-xs text-zinc-500">{mod.status}</span>
                </div>
                <Switch
                  checked={modulePrefs[mod.id]?.enabled !== false}
                  label={`Toggle ${mod.name}`}
                  onCheckedChange={() => toggleModule(mod.id)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Right column */}
      <section className="grid gap-4 content-start">
        {/* Ping targets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-sky-200" aria-hidden />
              Homelab Ping Targets
            </CardTitle>
            {status ? <Badge>{status}</Badge> : null}
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea
              onChange={(event) => setPingInput(event.target.value)}
              placeholder="https://cloudflare.com, https://github.com"
              value={pingInput}
            />
            <p className="text-xs text-zinc-500">
              Comma-separated URLs. The homelab module will ping these targets for latency and availability.
            </p>
            <Button onClick={savePingTargets} size="sm">
              <Save className="h-4 w-4" aria-hidden />
              Save Targets
            </Button>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-4 w-4 text-emerald-200" aria-hidden />
              Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void exportBackup()}>
                <Download className="h-4 w-4" aria-hidden />
                Export JSON
              </Button>
              <Button onClick={() => importRef.current?.click()} variant="secondary">
                <Upload className="h-4 w-4" aria-hidden />
                Import JSON
              </Button>
              <Button onClick={() => setStatus(null)} variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Reset status
              </Button>
              <input
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importBackup(file);
                }}
                ref={importRef}
                type="file"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        {profile ? (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-zinc-400">
              <div className="flex justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
                <span>Email</span>
                <span className="text-white">{profile.email}</span>
              </div>
              <div className="flex justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
                <span>Role</span>
                <Badge className={profile.role === "admin" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : ""}>
                  {profile.role}
                </Badge>
              </div>
              <div className="flex justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
                <span>Timezone</span>
                <span className="text-white">{profile.timezone}</span>
              </div>
              <div className="flex justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
                <span>Member since</span>
                <span className="text-white">{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Environment */}
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-zinc-400">
            <div className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">SQLite</div>
            <div className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">NextAuth JWT sessions</div>
            <div className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">Docker standalone output</div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
