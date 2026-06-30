"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = (await response.json()) as { ok: boolean; error?: { message: string } };

    if (!data.ok) {
      setError(data.error?.message ?? "Registration failed.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    window.location.href = "/";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-white">Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <Input
              autoComplete="name"
              autoFocus
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              required
              type="text"
              value={name}
            />
            <Input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              type="email"
              value={email}
            />
            <Input
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (min 8 characters)"
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
            {loading ? "Creating account..." : "Register"}
          </Button>
          <p className="text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link className="text-cyan-200 underline hover:text-cyan-100" href="/login">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
