"use client";

import { Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ModuleProps } from "@/types/module-props";

export function TerminalModule({}: ModuleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-200" aria-hidden />
          Terminal
        </CardTitle>
        <Badge>Hidden overlay armed</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 font-mono text-sm text-zinc-300">
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 p-4 text-emerald-100">
          Luxion terminal is listening from the logo.
        </div>
        <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-4">
          {["help", "clear", "date", "uptime", "status", "neofetch", "quote", "ascii", "matrix", "fortune"].map((command) => (
            <span key={command}>$ {command}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
