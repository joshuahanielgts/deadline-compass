import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "@/lib/api";

describe("API Client (AGENTS.md §8 & §10)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("handles network failure by throwing 'Cannot reach the server'", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(api.listActive()).rejects.toThrow("Cannot reach the server");
  });

  it("parses server error response with fieldErrors on HTTP 400", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 400,
          error: "Bad Request",
          message: "Validation failed",
          fieldErrors: { title: "Title cannot be blank" },
        }),
    } as Response);

    try {
      await api.create({ title: "", dueAt: new Date().toISOString() });
      expect.fail("Should have thrown ApiError");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.message).toBe("Validation failed");
      expect(err.fieldErrors?.title).toBe("Title cannot be blank");
    }
  });

  it("parses server conflict error on HTTP 409", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 409,
          error: "Conflict",
          message: "Deadline is already completed",
        }),
    } as Response);

    try {
      await api.complete(1);
      expect.fail("Should have thrown ApiError");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.message).toBe("Deadline is already completed");
    }
  });

  it("returns parsed json on successful response", async () => {
    const mockDeadline = {
      id: 1,
      title: "Task 1",
      shortDescription: null,
      longDescription: null,
      dueAt: "2026-12-01T12:00:00Z",
      completed: false,
      createdAt: "2026-10-26T12:00:00Z",
      completedAt: null,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([mockDeadline]),
    } as Response);

    const result = await api.listActive();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Task 1");
  });
});
