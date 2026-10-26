export interface Deadline {
  id: number;
  title: string;
  shortDescription: string | null;
  longDescription: string | null;
  dueAt: string; // ISO UTC
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Settings {
  redThresholdHours: number;
  yellowThresholdHours: number;
}

export interface NewDeadline {
  title: string;
  shortDescription?: string;
  longDescription?: string;
  dueAt: string;
}

export type Urgency = "overdue" | "red" | "yellow" | "green";

export const DEFAULT_SETTINGS: Settings = { redThresholdHours: 24, yellowThresholdHours: 72 };
