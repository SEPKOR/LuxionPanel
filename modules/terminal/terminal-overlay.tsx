"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface TerminalOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface Line {
  id: string;
  value: string;
  tone?: "muted" | "accent";
}

const bootLines: Line[] = [
  { id: "boot_1", value: "Luxion terminal online", tone: "accent" },
  { id: "boot_2", value: "type help", tone: "muted" },
];

const fortunes = [
  "Small systems stay fast when their edges stay visible.",
  "A clean backup is the quietest kind of confidence.",
  "The best dashboard answers before it asks for attention.",
];

function commandOutput(command: string, uptime: string): Line[] {
  const value = command.trim().toLowerCase();
  if (value === "help") {
    return [{ id: crypto.randomUUID(), value: "help clear date uptime status neofetch quote ascii matrix fortune" }];
  }
  if (value === "date") {
    return [{ id: crypto.randomUUID(), value: new Date().toString() }];
  }
  if (value === "uptime") {
    return [{ id: crypto.randomUUID(), value: uptime }];
  }
  if (value === "status") {
    return [{ id: crypto.randomUUID(), value: "status: online | modules: active | storage: mounted" }];
  }
  if (value === "neofetch") {
    return [
      { id: crypto.randomUUID(), value: "Luxion OS" },
      { id: crypto.randomUUID(), value: "Next.js 15 / SQLite / Prisma / Docker-ready" },
      { id: crypto.randomUUID(), value: "Theme: dark glass" },
    ];
  }
  if (value === "quote") {
    return [{ id: crypto.randomUUID(), value: "Make it useful, then make it calm." }];
  }
  if (value === "ascii") {
    return [
      { id: crypto.randomUUID(), value: " _              _             " },
      { id: crypto.randomUUID(), value: "| |   _   ___ _(_) ___  _ __  " },
      { id: crypto.randomUUID(), value: "| |  | | | \\ \\ / |/ _ \\| '_ \\ " },
      { id: crypto.randomUUID(), value: "| |__| |_| |>  <| | (_) | | | |" },
      { id: crypto.randomUUID(), value: "|_____\\__,_/_/\\_\\_|\\___/|_| |_|" },
    ];
  }
  if (value === "fortune") {
    return [{ id: crypto.randomUUID(), value: fortunes[Math.floor(Math.random() * fortunes.length)] }];
  }
  if (value === "matrix") {
    return [{ id: crypto.randomUUID(), value: "__MATRIX__" }];
  }
  if (!value) {
    return [];
  }
  return [{ id: crypto.randomUUID(), value: `command not found: ${value}` }];
}

export function TerminalOverlay({ open, onClose }: TerminalOverlayProps) {
  const [lines, setLines] = useState<Line[]>(bootLines);
  const [input, setInput] = useState("");
  const [matrix, setMatrix] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openedAt = useRef(Date.now());

  const uptime = `${Math.floor((Date.now() - openedAt.current) / 60000)}m ${Math.floor((Date.now() - openedAt.current) / 1000) % 60}s`;

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  function runCommand() {
    const command = input;
    setInput("");
    if (command.trim().toLowerCase() === "clear") {
      setLines([]);
      setMatrix(false);
      return;
    }

    const output = commandOutput(command, uptime);
    if (output.some((line) => line.value === "__MATRIX__")) {
      setMatrix((value) => !value);
      setLines((current) => [
        ...current,
        { id: crypto.randomUUID(), value: `$ ${command}`, tone: "muted" },
        { id: crypto.randomUUID(), value: "matrix toggled", tone: "accent" },
      ]);
      return;
    }

    setLines((current) => [...current, { id: crypto.randomUUID(), value: `$ ${command}`, tone: "muted" }, ...output]);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/72 p-3 backdrop-blur-md sm:p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className="relative mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-lg border border-emerald-300/20 bg-zinc-950/95 shadow-2xl shadow-black/60"
            exit={{ y: 18, opacity: 0 }}
            initial={{ y: 18, opacity: 0 }}
          >
            {matrix ? <MatrixRain /> : null}
            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-red-400" />
                <span className="h-3 w-3 rounded bg-amber-300" />
                <span className="h-3 w-3 rounded bg-emerald-300" />
              </div>
              <Button onClick={onClose} size="icon" variant="ghost" title="Close">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="thin-scrollbar relative z-10 flex-1 overflow-auto p-4 font-mono text-sm leading-6">
              {lines.map((line) => (
                <div className={line.tone === "accent" ? "text-emerald-200" : line.tone === "muted" ? "text-zinc-500" : "text-zinc-200"} key={line.id}>
                  {line.value}
                </div>
              ))}
            </div>
            <div className="relative z-10 flex items-center gap-2 border-t border-white/10 bg-black/40 px-4 py-3 font-mono text-sm">
              <span className="text-emerald-200">$</span>
              <input
                className="flex-1 bg-transparent text-zinc-100 outline-none"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && runCommand()}
                ref={inputRef}
                value={input}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MatrixRain() {
  const columns = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        id: index,
        left: `${(index / 36) * 100}%`,
        delay: `${(index % 9) * 0.18}s`,
        duration: `${2.4 + (index % 7) * 0.24}s`,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
      {columns.map((column) => (
        <span
          className="absolute top-[-30%] font-mono text-xs text-emerald-300"
          key={column.id}
          style={{
            animation: `matrix-drop ${column.duration} linear ${column.delay} infinite`,
            left: column.left,
          }}
        >
          0101101011010010110
        </span>
      ))}
      <style jsx>{`
        @keyframes matrix-drop {
          from {
            transform: translateY(-20%);
          }
          to {
            transform: translateY(140vh);
          }
        }
      `}</style>
    </div>
  );
}
