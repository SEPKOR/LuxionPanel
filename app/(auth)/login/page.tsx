"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-white">Sign in to Luxion OS</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <Input
              autoComplete="email"
              autoFocus
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              type="email"
              value={email}
            />
            <Input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />
          </div>
          {error ? (
            <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <Button className="w-full" disabled={loading} type="submit" variant="primary">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center text-xs text-zinc-500">
            No account?{" "}
            <Link className="text-cyan-200 underline hover:text-cyan-100" href="/register">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
