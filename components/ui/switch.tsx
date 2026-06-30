"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative h-6 w-11 rounded-md border border-white/10 transition",
        checked ? "bg-cyan-300/80" : "bg-white/10",
      )}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "absolute left-1 top-1 h-4 w-4 rounded bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
