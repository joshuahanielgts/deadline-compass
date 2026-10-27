import { describe, expect, it } from "vitest";
import { countdownText, getUrgency, joinHours, splitHours } from "@/lib/time";
import type { Settings } from "@/lib/types";

describe("Urgency logic and countdown calculations (AGENTS.md §5)", () => {
  const settings: Settings = { redThresholdHours: 24, yellowThresholdHours: 72 };
  const HOUR = 3_600_000;

  it("returns overdue when diff <= 0", () => {
    const now = 100_000_000;
    const exactlyNow = new Date(now).toISOString();
    const past = new Date(now - 2 * HOUR).toISOString();

    expect(getUrgency(exactlyNow, now, settings)).toBe("overdue");
    expect(getUrgency(past, now, settings)).toBe("overdue");
  });

  it("returns red when 0 < diff <= redThresholdHours", () => {
    const now = 100_000_000;
    const withinRed = new Date(now + 12 * HOUR).toISOString();
    const exactBoundary = new Date(now + 24 * HOUR).toISOString();

    expect(getUrgency(withinRed, now, settings)).toBe("red");
    expect(getUrgency(exactBoundary, now, settings)).toBe("red");
  });

  it("returns yellow when redThresholdHours < diff <= yellowThresholdHours", () => {
    const now = 100_000_000;
    const justOverRed = new Date(now + 24 * HOUR + 1000).toISOString();
    const exactYellow = new Date(now + 72 * HOUR).toISOString();

    expect(getUrgency(justOverRed, now, settings)).toBe("yellow");
    expect(getUrgency(exactYellow, now, settings)).toBe("yellow");
  });

  it("returns green when diff > yellowThresholdHours", () => {
    const now = 100_000_000;
    const wellAhead = new Date(now + 96 * HOUR).toISOString();

    expect(getUrgency(wellAhead, now, settings)).toBe("green");
  });

  it("formats countdown text correctly for future and overdue deadlines", () => {
    const now = 100_000_000;

    // Overdue
    expect(countdownText(new Date(now - 30 * 60 * 1000).toISOString(), now)).toBe(
      "Overdue by less than an hour",
    );
    expect(countdownText(new Date(now - 5 * HOUR).toISOString(), now)).toBe(
      "Overdue by 5 hours",
    );
    expect(countdownText(new Date(now - 26 * HOUR).toISOString(), now)).toBe(
      "Overdue by 1d 2h",
    );

    // Future
    expect(countdownText(new Date(now + 30 * 60 * 1000).toISOString(), now)).toBe(
      "Less than an hour left",
    );
    expect(countdownText(new Date(now + 5 * HOUR).toISOString(), now)).toBe(
      "5 hours left",
    );
    expect(countdownText(new Date(now + 26 * HOUR).toISOString(), now)).toBe(
      "1 day 2 hours left",
    );
  });

  it("splits and joins hours accurately", () => {
    expect(splitHours(72)).toEqual({ days: 3, hours: 0 });
    expect(splitHours(25)).toEqual({ days: 1, hours: 1 });
    expect(joinHours(3, 0)).toBe(72);
    expect(joinHours(1, 1)).toBe(25);
  });
});
