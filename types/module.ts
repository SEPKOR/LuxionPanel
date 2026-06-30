export const moduleIds = [
  "home",
  "dashboard",
  "homelab",
  "notes",
  "tasks",
  "files",
  "gallery",
  "music",
  "bookmarks",
  "ai",
  "analytics",
  "terminal",
  "settings",
  "admin",
] as const;

export type ModuleId = (typeof moduleIds)[number];

export type ModuleStatus = "online" | "local" | "beta";

export interface LuxionModule {
  id: ModuleId;
  name: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  status: ModuleStatus;
  keywords: string[];
  enabled: boolean;
}

export interface GlobalSearchItem {
  id: string;
  moduleId: ModuleId;
  title: string;
  subtitle: string;
  keywords: string[];
}
