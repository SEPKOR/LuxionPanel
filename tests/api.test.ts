import { describe, expect, it } from "vitest";
import { ok, fail } from "@/lib/api";

describe("ok", () => {
  it("returns success response", () => {
    const res = ok({ message: "hello" });
    expect(res.status).toBe(200);
  });
});

describe("fail", () => {
  it("returns error response with status", () => {
    const res = fail("not_found", "Item missing", 404);
    expect(res.status).toBe(404);
  });
});
