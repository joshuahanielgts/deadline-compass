import { type Deadline, type NewDeadline, type Settings } from "./types";

const BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) || "http://localhost:8081";

export class ApiError extends Error {
  fieldErrors?: Record<string, string> | undefined;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    const opts: RequestInit = { method: init.method ?? "GET" };
    if (init.body !== undefined) {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(init.body);
    }
    res = await fetch(`${BASE}${path}`, opts);
  } catch {
    throw new ApiError("Cannot reach the server");
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const d = data as { message?: string; fieldErrors?: Record<string, string> } | null;
    throw new ApiError(d?.message || `Request failed (${res.status})`, d?.fieldErrors);
  }
  return data as T;
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/* ---------- Public API (AGENTS.md §8 & §10) ---------- */
export const api = {
  listActive: (): Promise<Deadline[]> => request("/api/deadlines/active"),
  listCompleted: (): Promise<Deadline[]> => request("/api/deadlines/completed"),
  get: (id: number): Promise<Deadline> => request(`/api/deadlines/${id}`),
  create: (input: NewDeadline): Promise<Deadline> =>
    request("/api/deadlines", { method: "POST", body: input }),
  changeDueDate: (id: number, dueAt: string): Promise<Deadline> =>
    request(`/api/deadlines/${id}/due-date`, { method: "PATCH", body: { dueAt } }),
  complete: (id: number): Promise<Deadline> =>
    request(`/api/deadlines/${id}/complete`, { method: "POST" }),
  restore: (id: number): Promise<Deadline> =>
    request(`/api/deadlines/${id}/restore`, { method: "POST" }),
  remove: (id: number): Promise<void> =>
    request(`/api/deadlines/${id}`, { method: "DELETE" }),
  getSettings: (): Promise<Settings> => request("/api/settings"),
  putSettings: (s: Settings): Promise<Settings> =>
    request("/api/settings", { method: "PUT", body: s }),
};

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
