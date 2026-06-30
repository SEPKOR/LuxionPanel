import {
  Bookmark,
  ChartNoAxesCombined,
  FolderOpen,
  Home,
  Images,
  LayoutDashboard,
  ListTodo,
  Music2,
  NotebookPen,
  ServerCog,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Bookmark,
  ChartNoAxesCombined,
  FolderOpen,
  Home,
  Images,
  LayoutDashboard,
  ListTodo,
  Music2,
  NotebookPen,
  ServerCog,
  Settings,
  Shield,
  Sparkles,
  Terminal,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden />;
}
