import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/types/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "validation", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
        { status: 400 },
      );
    }

    const { email, password, name } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: { code: "email_taken", message: "Email is already registered." } },
        { status: 409 },
      );
    }

    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? "admin" : "user";

    const hashed = hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        role,
      },
    });

    return NextResponse.json({ ok: true, data: { registered: true } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "internal", message: "Registration failed." } },
      { status: 500 },
    );
  }
}
