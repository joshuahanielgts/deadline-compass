import { format } from "date-fns";
import type { Settings, Urgency } from "./types";

const HOUR = 3_600_000;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function countdownText(dueAt: string, now: number): string {
  const diff = new Date(dueAt).getTime() - now;
  if (diff <= 0) {
    const h = Math.floor(-diff / HOUR);
    if (h < 1) return "Overdue by less than an hour";
    const d = Math.floor(h / 24);
    const rh = h % 24;
    if (d >= 1) return `Overdue by ${d}d${rh ? ` ${rh}h` : ""}`;
    return `Overdue by ${plural(h, "hour")}`;
  }
  const h = Math.floor(diff / HOUR);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${plural(d, "day")}${rh ? ` ${plural(rh, "hour")}` : ""} left`;
  }
  if (h >= 1) return `${plural(h, "hour")} left`;
  return "Less than an hour left";
}

export function getUrgency(dueAt: string, now: number, s: Settings): Urgency {
  const diff = new Date(dueAt).getTime() - now;
  if (diff <= 0) return "overdue";
  if (diff <= s.redThresholdHours * HOUR) return "red";
  if (diff <= s.yellowThresholdHours * HOUR) return "yellow";
  return "green";
}

export const urgencyLabel: Record<Urgency, string> = {
  overdue: "Overdue",
  red: "Urgent",
  yellow: "Due soon",
  green: "On track",
};

export const fmtShort = (iso: string) => format(new Date(iso), "EEE, d MMM · h:mm a");
export const fmtLong = (iso: string) => format(new Date(iso), "EEEE, d MMMM yyyy · h:mm a");
export const fmtDate = (iso: string) => format(new Date(iso), "d MMM yyyy");

export const splitHours = (total: number) => ({ days: Math.floor(total / 24), hours: total % 24 });
export const joinHours = (days: number, hours: number) => days * 24 + hours;
