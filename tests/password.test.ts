import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("hashPassword", () => {
  it("produces a hash with salt prefix", () => {
    const hash = hashPassword("test123");
    expect(hash).toMatch(/^[a-f0-9]+:/);
  });

  it("produces different hashes for same password", () => {
    const a = hashPassword("test123");
    const b = hashPassword("test123");
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("verifies correct password", () => {
    const hash = hashPassword("correct-horse");
    expect(verifyPassword("correct-horse", hash)).toBe(true);
  });

  it("rejects wrong password", () => {
    const hash = hashPassword("correct-horse");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects invalid hash format", () => {
    expect(verifyPassword("any", "broken")).toBe(false);
  });
});
