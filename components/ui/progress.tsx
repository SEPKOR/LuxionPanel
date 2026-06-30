import { cn, clamp } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn("h-2 overflow-hidden rounded-md bg-white/10", className)}
      role="progressbar"
    >
      <div
        className={cn("h-full rounded-md bg-cyan-300 transition-[width] duration-500", indicatorClassName)}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}
