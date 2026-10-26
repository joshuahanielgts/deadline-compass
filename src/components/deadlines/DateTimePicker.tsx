import { useState } from "react";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: Date | undefined;
  onChange: (d: Date) => void;
  invalid?: boolean;
  id?: string;
}

export function DateTimePicker({ value, onChange, invalid, id }: Props) {
  const [open, setOpen] = useState(false);
  const time = value ? format(value, "HH:mm") : "09:00";

  const setDay = (day: Date | undefined) => {
    if (!day) return;
    const [h = 9, m = 0] = time.split(":").map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    onChange(d);
  };
  const setTime = (v: string) => {
    if (!v) return;
    const [h = 0, m = 0] = v.split(":").map(Number);
    const d = value ? new Date(value) : new Date();
    d.setHours(h, m, 0, 0);
    onChange(d);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={invalid}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm tabular shadow-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            invalid && "border-destructive",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-4 text-primary" aria-hidden />
          {value ? format(value, "EEE, d MMM · h:mm a") : "Pick date & time"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl p-3" align="end">
        <Calendar mode="single" selected={value} onSelect={setDay} {...(value ? { defaultMonth: value } : {})} />
        <div className="mt-2 flex items-center gap-2 border-t pt-3">
          <label htmlFor="dtp-time" className="text-sm text-muted-foreground">
            Time
          </label>
          <Input
            id="dtp-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="tabular h-10"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
