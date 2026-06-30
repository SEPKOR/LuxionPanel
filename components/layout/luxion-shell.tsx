"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command, Loader2, LogOut, Menu, Moon, Search, Sun, User, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { ModuleIcon } from "@/components/layout/module-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/error-boundary";
import { enabledModules, modules } from "@/lib/modules";
import { getGlobalSearchItems } from "@/lib/sample-data";
import type { ModuleId } from "@/types/module";
import type { ModuleProps } from "@/types/module-props";
import type { AppSettings } from "@/types/settings";
import { defaultSettings } from "@/types/settings";
import { cn, initials } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

const HomeModule = dynamic(() => import("@/modules/home").then((m) => ({ default: m.HomeModule })));
const DashboardModule = dynamic(() => import("@/modules/dashboard").then((m) => ({ default: m.DashboardModule })));
const HomelabModule = dynamic(() => import("@/modules/homelab").then((m) => ({ default: m.HomelabModule })));
const NotesModule = dynamic(() => import("@/modules/notes").then((m) => ({ default: m.NotesModule })));
const TasksModule = dynamic(() => import("@/modules/tasks").then((m) => ({ default: m.TasksModule })));
const FilesModule = dynamic(() => import("@/modules/files").then((m) => ({ default: m.FilesModule })));
const GalleryModule = dynamic(() => import("@/modules/gallery").then((m) => ({ default: m.GalleryModule })));
const MusicModule = dynamic(() => import("@/modules/music").then((m) => ({ default: m.MusicModule })));
const BookmarksModule = dynamic(() => import("@/modules/bookmarks").then((m) => ({ default: m.BookmarksModule })));
const AiModule = dynamic(() => import("@/modules/ai").then((m) => ({ default: m.AiModule })));
const AnalyticsModule = dynamic(() => import("@/modules/analytics").then((m) => ({ default: m.AnalyticsModule })));
const TerminalModule = dynamic(() => import("@/modules/terminal").then((m) => ({ default: m.TerminalModule })));
const SettingsModule = dynamic(() => import("@/modules/settings").then((m) => ({ default: m.SettingsModule })));
const AdminModule = dynamic(() => import("@/modules/admin").then((m) => ({ default: m.AdminModule })));
const TerminalOverlay = dynamic(() => import("@/modules/terminal/terminal-overlay").then((m) => ({ default: m.TerminalOverlay })));

const ModuleSuspense = memo(function ModuleSuspense() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-200" aria-hidden />
    </div>
  );
});

const moduleViews: Record<ModuleId, ComponentType<ModuleProps>> = {
  home: HomeModule as ComponentType<ModuleProps>,
  dashboard: DashboardModule as ComponentType<ModuleProps>,
  homelab: HomelabModule as ComponentType<ModuleProps>,
  notes: NotesModule as ComponentType<ModuleProps>,
  tasks: TasksModule as ComponentType<ModuleProps>,
  files: FilesModule as ComponentType<ModuleProps>,
  gallery: GalleryModule as ComponentType<ModuleProps>,
  music: MusicModule as ComponentType<ModuleProps>,
  bookmarks: BookmarksModule as ComponentType<ModuleProps>,
  ai: AiModule as ComponentType<ModuleProps>,
  analytics: AnalyticsModule as ComponentType<ModuleProps>,
  terminal: TerminalModule as ComponentType<ModuleProps>,
  settings: SettingsModule as ComponentType<ModuleProps>,
  admin: AdminModule as ComponentType<ModuleProps>,
};

const accentClasses: Record<string, string> = {
  cyan: "border-cyan-300/30 bg-cyan-300/12 text-cyan-100",
  blue: "border-blue-300/30 bg-blue-300/12 text-blue-100",
  emerald: "border-emerald-300/30 bg-emerald-300/12 text-emerald-100",
  amber: "border-amber-300/30 bg-amber-300/12 text-amber-100",
  rose: "border-rose-300/30 bg-rose-300/12 text-rose-100",
  sky: "border-sky-300/30 bg-sky-300/12 text-sky-100",
  fuchsia: "border-fuchsia-300/30 bg-fuchsia-300/12 text-fuchsia-100",
  lime: "border-lime-300/30 bg-lime-300/12 text-lime-100",
  orange: "border-orange-300/30 bg-orange-300/12 text-orange-100",
  violet: "border-violet-300/30 bg-violet-300/12 text-violet-100",
  teal: "border-teal-300/30 bg-teal-300/12 text-teal-100",
  green: "border-green-300/30 bg-green-300/12 text-green-100",
  slate: "border-slate-300/30 bg-slate-300/12 text-slate-100",
};

const LogoButton = memo(function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Luxion"
      className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-sm font-bold text-cyan-100 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300/15"
      onClick={onClick}
      type="button"
    >
      LX
    </button>
  );
});

const MobileNav = memo(function MobileNav({
  activeModule,
  onClose,
  onSelect,
  open,
}: {
  activeModule: ModuleId;
  onClose: () => void;
  onSelect: (moduleId: ModuleId) => void;
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
          <motion.nav
            animate={{ x: 0 }}
            className="h-full w-80 max-w-[84vw] border-r border-white/10 bg-zinc-950 p-3"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Luxion OS</span>
              <Button onClick={onClose} size="icon" variant="ghost">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="grid gap-2">
              {enabledModules.map((module) => (
                <button
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-3 text-left text-sm text-zinc-300",
                    activeModule === module.id && accentClasses[module.accent],
                  )}
                  key={module.id}
                  onClick={() => onSelect(module.id)}
                  type="button"
                >
                  <ModuleIcon className="h-4 w-4" name={module.icon} />
                  {module.name}
                </button>
              ))}
            </div>
          </motion.nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

const GlobalSearch = memo(function GlobalSearch({
  onClose,
  onSelect,
  open,
}: {
  onClose: () => void;
  onSelect: (moduleId: ModuleId) => void;
  open: boolean;
}) {
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const moduleItems = enabledModules.map((module) => ({
      id: module.id,
      moduleId: module.id,
      title: module.name,
      subtitle: module.description,
      keywords: module.keywords,
    }));
    return [...moduleItems, ...getGlobalSearchItems()];
  }, []);

  const visibleItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items.slice(0, 8);
    return items
      .filter((item) => [item.title, item.subtitle, ...item.keywords].some((keyword) => keyword.toLowerCase().includes(value)))
      .slice(0, 10);
  }, [items, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/60 p-3 backdrop-blur-sm" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className="mx-auto mt-[10vh] max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60"
            exit={{ y: 16, opacity: 0 }}
            initial={{ y: 16, opacity: 0 }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-5 w-5 text-cyan-200" aria-hidden />
              <input
                autoFocus
                className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Luxion OS"
                value={query}
              />
              <Button onClick={onClose} size="icon" variant="ghost">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="grid max-h-[55vh] gap-2 overflow-auto p-3 thin-scrollbar">
              {visibleItems.map((item) => {
                const moduleInfo = modules.find((current) => current.id === item.moduleId);
                return (
                  <button
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.075]"
                    key={`${item.moduleId}-${item.id}`}
                    onClick={() => onSelect(item.moduleId)}
                    type="button"
                  >
                    <span className={cn("grid h-10 w-10 place-items-center rounded-lg border", accentClasses[moduleInfo?.accent ?? "cyan"])}>
                      <ModuleIcon className="h-4 w-4" name={moduleInfo?.icon ?? "Search"} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-zinc-500">{item.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

/* ---------- Main Shell ---------- */

export function LuxionShell() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeModule, setActiveModule] = useState<ModuleId>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [starBurst, setStarBurst] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const loadSettingsFromProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/user/profile");
      const payload = (await response.json()) as ApiResponse<{
        theme: string; language: string; animations: boolean;
        compactMode: boolean; weatherLocation: string; timezone: string;
      }>;
      if (payload.ok && payload.data) {
        setSettings({
          theme: (payload.data.theme === "light" ? "light" : "dark") as "dark" | "light",
          language: (payload.data.language ?? "en") as "en" | "id",
          animations: payload.data.animations ?? true,
          autoBackup: false,
          compactMode: payload.data.compactMode ?? false,
          weatherLocation: payload.data.weatherLocation ?? "Jakarta",
          timezone: payload.data.timezone ?? "UTC",
        });
      }
    } catch {
      // Fall back to defaults
    }
  }, []);

  useEffect(() => {
    if (session?.user) void loadSettingsFromProfile();
  }, [session, loadSettingsFromProfile]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.animations = settings.animations ? "on" : "off";
  }, [settings.theme, settings.animations]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!logoClicks) return;
    if (logoClicks >= 3) {
      setTerminalOpen(true);
      setLogoClicks(0);
      return;
    }
    const timer = window.setTimeout(() => setLogoClicks(0), 650);
    return () => window.clearTimeout(timer);
  }, [logoClicks]);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogoClicks = useCallback(() => setLogoClicks((v) => v + 1), []);
  const toggleTheme = useCallback(() => {
    setSettings((current) => {
      const nextTheme = current.theme === "dark" ? "light" : "dark";
      if (nextTheme === "dark") {
        setStarBurst(true);
        window.setTimeout(() => setStarBurst(false), 1200);
      }
      return { ...current, theme: nextTheme };
    });
  }, []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);
  const handleCloseMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openModule = useCallback((moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setMobileNavOpen(false);
  }, []);
  const handleSearchSelect = useCallback((moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setSearchOpen(false);
  }, []);

  const moduleProps = useMemo<ModuleProps>(
    () => ({
      openModule,
      settings,
      setSettings,
      userId: session?.user?.id,
      userRole: (session?.user as Record<string, unknown> | undefined)?.role as string | undefined,
    }),
    [openModule, settings, setSettings, session?.user],
  );

  const activeMeta = modules.find((m) => m.id === activeModule) ?? modules[0];
  const ActiveModule = moduleViews[activeModule];

  return (
    <div className="luxion-bg min-h-screen">
      <StarBurst visible={starBurst} />
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-20 border-r border-white/10 bg-black/20 p-3 backdrop-blur-xl lg:block">
        <nav className="flex h-full flex-col items-center gap-2">
          <LogoButton onClick={handleLogoClicks} />
          <div className="mt-4 flex flex-1 flex-col gap-2">
            {enabledModules.map((module) => (
              <button
                aria-label={module.name}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-lg border border-transparent text-zinc-500 transition hover:border-white/10 hover:bg-white/[0.07] hover:text-white",
                  activeModule === module.id && accentClasses[module.accent],
                )}
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                title={module.name}
                type="button"
              >
                <ModuleIcon className="h-5 w-5" name={module.icon} />
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className={cn("min-h-screen px-3 pb-24 pt-3 transition lg:ml-20 lg:px-6 lg:pb-6", settings.compactMode && "lg:px-4")}>
        <header className="glass-panel sticky top-3 z-20 mx-auto mb-4 flex max-w-7xl items-center gap-3 rounded-lg px-3 py-2 shadow-xl shadow-black/20">
          <Button className="lg:hidden" onClick={() => setMobileNavOpen(true)} size="icon" variant="ghost">
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <div className="hidden lg:block">
            <LogoButton onClick={handleLogoClicks} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white sm:text-base">{activeMeta.name}</h1>
              <Badge className={accentClasses[activeMeta.accent]}>{activeMeta.status}</Badge>
            </div>
            <p className="mt-0.5 hidden truncate text-xs text-zinc-500 sm:block">{activeMeta.description}</p>
          </div>
          <button
            className="hidden h-10 min-w-72 items-center gap-3 rounded-md border border-white/10 bg-zinc-950/40 px-3 text-left text-sm text-zinc-500 transition hover:border-cyan-300/30 hover:text-zinc-300 md:flex"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="flex-1">Search everything</span>
            <Command className="h-4 w-4" aria-hidden />
          </button>
          <Button className="md:hidden" onClick={() => setSearchOpen(true)} size="icon" variant="ghost" title="Search">
            <Search className="h-5 w-5" aria-hidden />
          </Button>
          <Button onClick={toggleTheme} size="icon" variant="ghost" title="Toggle theme">
            {settings.theme === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
          </Button>
          <div className="relative" ref={userMenuRef}>
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
              onClick={() => setUserMenuOpen((v) => !v)}
              title={session?.user?.name ?? "User"}
              type="button"
            >
              {session?.user?.name ? initials(session.user.name) : <User className="h-4 w-4" aria-hidden />}
            </button>
            {userMenuOpen ? (
              <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-xl shadow-black/40">
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="truncate text-sm font-medium text-white">{session?.user?.name ?? "User"}</p>
                  <p className="truncate text-xs text-zinc-500">{session?.user?.email}</p>
                </div>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                  onClick={() => { setActiveModule("settings"); setUserMenuOpen(false); }}
                  type="button"
                >
                  <User className="h-4 w-4" aria-hidden /> Settings
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-red-500/10 hover:text-red-200"
                  onClick={() => signOut()}
                  type="button"
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <section className="mx-auto max-w-7xl">
          <AnimatePresence mode="popLayout">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              key={activeModule}
              style={{ willChange: "transform, opacity" }}
              transition={{ duration: settings.animations ? 0.15 : 0 }}
            >
              <ErrorBoundary>
                <Suspense fallback={<ModuleSuspense />}>
                  <ActiveModule {...moduleProps} />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <MobileNav activeModule={activeModule} onClose={handleCloseMobileNav} onSelect={openModule} open={mobileNavOpen} />
      <GlobalSearch onClose={handleCloseSearch} onSelect={handleSearchSelect} open={searchOpen} />
      {terminalOpen ? <TerminalOverlay onClose={() => setTerminalOpen(false)} open={terminalOpen} /> : null}
    </div>
  );
}

function StarBurst({ visible }: { visible: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 37) % 84)}%`,
        top: `${8 + ((index * 19) % 78)}%`,
        delay: `${(index % 8) * 0.045}s`,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div animate={{ opacity: 1 }} className="pointer-events-none fixed inset-0 z-40" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
          {stars.map((star) => (
            <motion.span
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.8] }}
              className="absolute h-1.5 w-1.5 rounded bg-white shadow-[0_0_18px_rgba(255,255,255,0.75)]"
              key={star.id}
              style={{ left: star.left, top: star.top }}
              transition={{ delay: Number.parseFloat(star.delay), duration: 0.7 }}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
