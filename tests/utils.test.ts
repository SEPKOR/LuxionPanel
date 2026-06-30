import { describe, expect, it } from "vitest";
import { clamp, cn, formatBytes, initials, safeJsonParse, uid } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditionals", () => {
    expect(cn("foo", false && "bar", undefined, "baz")).toBe("foo baz");
  });
});

describe("formatBytes", () => {
  it("formats zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5_242_880)).toBe("5.0 MB");
  });

  it("handles negative", () => {
    expect(formatBytes(-1)).toBe("0 B");
  });
});

describe("clamp", () => {
  it("clamps low values", () => {
    expect(clamp(-5)).toBe(0);
  });

  it("clamps high values", () => {
    expect(clamp(150)).toBe(100);
  });

  it("passes values in range", () => {
    expect(clamp(50)).toBe(50);
  });
});

describe("initials", () => {
  it("returns initials", () => {
    expect(initials("John Doe")).toBe("JD");
  });

  it("handles single word", () => {
    expect(initials("Admin")).toBe("A");
  });
});

describe("safeJsonParse", () => {
  it("returns parsed value", () => {
    expect(safeJsonParse('{"a":1}', null)).toEqual({ a: 1 });
  });

  it("returns fallback for null", () => {
    expect(safeJsonParse(null, "fallback")).toBe("fallback");
  });

  it("returns fallback for invalid JSON", () => {
    expect(safeJsonParse("not-json", [])).toEqual([]);
  });
});

describe("uid", () => {
  it("generates prefixed ID", () => {
    const id = uid("test");
    expect(id).toMatch(/^test_[a-f0-9-]{8}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});
