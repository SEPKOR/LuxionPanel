import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/10 bg-white/[0.035] text-center">
      <Icon className="h-8 w-8 text-zinc-500" aria-hidden />
      <p className="max-w-64 text-sm text-zinc-400">{title}</p>
    </div>
  );
}
