import type { Urgency } from "@/lib/types";

export const urgencyStyles: Record<Urgency, { rail: string; pill: string }> = {
  overdue: { rail: "bg-urgent-red", pill: "bg-urgent-red-tint text-urgent-red-ink" },
  red: { rail: "bg-urgent-red", pill: "bg-urgent-red-tint text-urgent-red-ink" },
  yellow: { rail: "bg-urgent-yellow", pill: "bg-urgent-yellow-tint text-urgent-yellow-ink" },
  green: { rail: "bg-urgent-green", pill: "bg-urgent-green-tint text-urgent-green-ink" },
};
