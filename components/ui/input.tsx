import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-zinc-950/50 px-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-md border border-white/10 bg-zinc-950/50 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
