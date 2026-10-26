import { DEFAULT_SETTINGS, type Deadline, type NewDeadline, type Settings } from "./types";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8080";

export class ApiError extends Error {
  fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
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

/* ---------- Minimal mock (starts empty, persists to localStorage) ---------- */
const KEY = "deadline-manager-mock";
type Store = { deadlines: Deadline[]; settings: Settings; nextId: number };
function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* ignore */
  }
  return { deadlines: [], settings: { ...DEFAULT_SETTINGS }, nextId: 1 };
}
function save(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 150));
function find(s: Store, id: number) {
  const d = s.deadlines.find((x) => x.id === id);
  if (!d) throw new ApiError("Deadline not found");
  return d;
}
const t = (iso: string) => new Date(iso).getTime();

const mock = {
  active: () => delay(load().deadlines.filter((d) => !d.completed).sort((a, b) => t(a.dueAt) - t(b.dueAt))),
  completed: () =>
    delay(load().deadlines.filter((d) => d.completed).sort((a, b) => t(b.completedAt!) - t(a.completedAt!))),
  create: (input: NewDeadline) => {
    const s = load();
    const d: Deadline = {
      id: s.nextId++,
      title: input.title,
      shortDescription: input.shortDescription || null,
      longDescription: input.longDescription || null,
      dueAt: input.dueAt,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    s.deadlines.push(d);
    save(s);
    return delay(d);
  },
  mutate: (id: number, fn: (d: Deadline) => void) => {
    const s = load();
    const d = find(s, id);
    fn(d);
    save(s);
    return delay(d);
  },
  remove: (id: number) => {
    const s = load();
    find(s, id);
    s.deadlines = s.deadlines.filter((d) => d.id !== id);
    save(s);
    return delay(undefined);
  },
  getSettings: () => delay(load().settings),
  putSettings: (v: Settings) => {
    const s = load();
    s.settings = v;
    save(s);
    return delay(v);
  },
};

/* ---------- Public API ---------- */
export const api = {
  listActive: (): Promise<Deadline[]> => (USE_MOCK ? mock.active() : request("/api/deadlines/active")),
  listCompleted: (): Promise<Deadline[]> =>
    USE_MOCK ? mock.completed() : request("/api/deadlines/completed"),
  create: (input: NewDeadline): Promise<Deadline> =>
    USE_MOCK ? mock.create(input) : request("/api/deadlines", { method: "POST", body: input }),
  changeDueDate: (id: number, dueAt: string): Promise<Deadline> =>
    USE_MOCK
      ? mock.mutate(id, (d) => (d.dueAt = dueAt))
      : request(`/api/deadlines/${id}/due-date`, { method: "PATCH", body: { dueAt } }),
  complete: (id: number): Promise<Deadline> =>
    USE_MOCK
      ? mock.mutate(id, (d) => {
          d.completed = true;
          d.completedAt = new Date().toISOString();
        })
      : request(`/api/deadlines/${id}/complete`, { method: "POST" }),
  restore: (id: number): Promise<Deadline> =>
    USE_MOCK
      ? mock.mutate(id, (d) => {
          d.completed = false;
          d.completedAt = null;
        })
      : request(`/api/deadlines/${id}/restore`, { method: "POST" }),
  remove: (id: number): Promise<void> =>
    USE_MOCK ? mock.remove(id) : request(`/api/deadlines/${id}`, { method: "DELETE" }),
  getSettings: (): Promise<Settings> => (USE_MOCK ? mock.getSettings() : request("/api/settings")),
  putSettings: (s: Settings): Promise<Settings> =>
    USE_MOCK ? mock.putSettings(s) : request("/api/settings", { method: "PUT", body: s }),
};

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
