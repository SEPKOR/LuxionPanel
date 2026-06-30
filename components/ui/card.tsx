import { memo } from "react";
import { cn } from "@/lib/utils";

export const Card = memo(function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 bg-white/[0.065] shadow-[0_12px_40px_rgba(0,0,0,0.24)]",
        className,
      )}
      {...props}
    />
  );
});

export const CardHeader = memo(function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 p-4 pb-2", className)} {...props} />;
});

export const CardTitle = memo(function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-white", className)} {...props} />;
});

export const CardContent = memo(function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-2", className)} {...props} />;
});
