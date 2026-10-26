import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import { api, errMsg } from "@/lib/api";
import { joinHours, splitHours } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageStates";
import { cn } from "@/lib/utils";

type Pair = { days: string; hours: string };
const toPair = (h: number): Pair => {
  const s = splitHours(h);
  return { days: String(s.days), hours: String(s.hours) };
};
const isInt = (v: string) => /^\d+$/.test(v);
const describe = (h: number) => {
  const { days, hours } = splitHours(h);
  const parts = [days && `${days} day${days === 1 ? "" : "s"}`, hours && `${hours} hour${hours === 1 ? "" : "s"}`].filter(Boolean);
  return parts.join(" ") || "0 hours";
};

function pairError(p: Pair) {
  if (!isInt(p.days) || !isInt(p.hours)) return "Use whole numbers.";
  if (+p.days > 365) return "Days must be between 0 and 365.";
  if (+p.hours > 23) return "Hours must be between 0 and 23.";
  return null;
}

export default function DeadlineSettings({ settings, onSaved }: { settings: Settings; onSaved: (s: Settings) => void }) {
  const [red, setRed] = useState(toPair(settings.redThresholdHours));
  const [yellow, setYellow] = useState(toPair(settings.yellowThresholdHours));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setRed(toPair(settings.redThresholdHours));
    setYellow(toPair(settings.yellowThresholdHours));
  }, [settings]);

  const redErr = pairError(red);
  const yellowErr = pairError(yellow);
  const redH = redErr ? NaN : joinHours(+red.days, +red.hours);
  const yellowH = yellowErr ? NaN : joinHours(+yellow.days, +yellow.hours);
  const redMsg = redErr ?? (redH <= 0 ? "Red must be greater than 0 hours." : null);
  const yellowMsg =
    yellowErr ??
    (yellowH > 8760
      ? "Yellow can be at most 365 days (8760 hours)."
      : !redMsg && yellowH <= redH
        ? "Yellow must be longer than red."
        : null);
  const invalid = !!(redMsg || yellowMsg);
  const unchanged = redH === settings.redThresholdHours && yellowH === settings.yellowThresholdHours;

  const save = async () => {
    if (invalid || unchanged || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      const s = await api.putSettings({ redThresholdHours: redH, yellowThresholdHours: yellowH });
      onSaved(s);
      toast.success("Settings saved");
    } catch (e) {
      setServerError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Deadline settings" subtitle="Decide when a deadline turns yellow and red." />
      <div className="grid max-w-3xl gap-4">
        <Group
          tone="red"
          title="Red — urgent"
          explain="A deadline turns red when this much time or less is left."
          pair={red}
          setPair={setRed}
          error={redMsg}
        />
        <Group
          tone="yellow"
          title="Yellow — due soon"
          explain="A deadline turns yellow when this much time or less is left."
          pair={yellow}
          setPair={setYellow}
          error={yellowMsg}
        />
        <section className="relative overflow-hidden rounded-2xl border bg-card p-5 pl-7 shadow-card">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-urgent-green" />
          <h2 className="font-semibold">Green — on track</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything due in more than {Number.isNaN(yellowH) ? "the yellow threshold" : describe(yellowH)} stays green.
          </p>
        </section>
        <section className="rounded-2xl bg-muted/60 p-5 text-sm text-muted-foreground">
          <h2 className="mb-1 font-semibold text-foreground">How it works</h2>
          Colours are worked out from the time left until each deadline, and update on their own every minute. Anything
          past its due date is marked overdue in red.
        </section>
        {serverError && (
          <div role="alert" className="rounded-xl bg-urgent-red-tint px-3 py-2 text-sm text-urgent-red-ink">
            {serverError}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => {
              setRed(toPair(DEFAULT_SETTINGS.redThresholdHours));
              setYellow(toPair(DEFAULT_SETTINGS.yellowThresholdHours));
            }}
          >
            Reset to defaults
          </Button>
          <Button className="h-11 px-6" disabled={invalid || unchanged || saving} onClick={save}>
            {saving && <Loader2 className="animate-spin" />} Save settings
          </Button>
        </div>
      </div>
    </>
  );
}

function Group(p: {
  tone: "red" | "yellow";
  title: string;
  explain: string;
  pair: Pair;
  setPair: (p: Pair) => void;
  error: string | null;
}) {
  const id = `set-${p.tone}`;
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card p-5 pl-7 shadow-card">
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", p.tone === "red" ? "bg-urgent-red" : "bg-urgent-yellow")} />
      <h2 className="font-semibold">{p.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{p.explain}</p>
      <div className="mt-4 flex flex-wrap gap-4">
        {(["days", "hours"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <Input
              id={`${id}-${k}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={k === "days" ? 365 : 23}
              value={p.pair[k]}
              aria-invalid={!!p.error}
              aria-describedby={`${id}-err`}
              onChange={(e) => p.setPair({ ...p.pair, [k]: e.target.value })}
              className="tabular h-11 w-24"
            />
            <span className="capitalize text-muted-foreground">{k}</span>
          </label>
        ))}
      </div>
      {p.error && (
        <p id={`${id}-err`} className="mt-2 text-xs text-destructive">
          {p.error}
        </p>
      )}
    </section>
  );
}
