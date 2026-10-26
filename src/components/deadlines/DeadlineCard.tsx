import { Check, EllipsisVertical } from "lucide-react";
import type { Deadline, Settings } from "@/lib/types";
import { countdownText, fmtShort, getUrgency, urgencyLabel } from "@/lib/time";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { urgencyStyles } from "./urgency";

interface Props {
  deadline: Deadline;
  now: number;
  settings: Settings;
  leaving?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onChange: () => void;
  onComplete: () => void;
}

export function DeadlineCard({ deadline: d, now, settings, leaving, onOpen, onDelete, onChange, onComplete }: Props) {
  const u = getUrgency(d.dueAt, now, settings);
  const s = urgencyStyles[u];
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${d.title}, ${urgencyLabel[u]}, ${countdownText(d.dueAt, now)}. Open details`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group relative flex animate-fade-up cursor-pointer gap-3 overflow-hidden rounded-2xl border bg-card py-4 pl-6 pr-3 shadow-card transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-lift",
        leaving && "pointer-events-none scale-[0.98] opacity-0",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", s.rail)} />
      <span className="sr-only">{urgencyLabel[u]}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="tabular truncate text-xs text-muted-foreground">{fmtShort(d.dueAt)}</span>
          <span className={cn("tabular shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", s.pill)}>
            {countdownText(d.dueAt, now)}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug break-words">{d.title}</h3>
        {d.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground break-words">{d.shortDescription}</p>
        )}
      </div>
      <div className="flex flex-col items-center justify-between gap-2" onClick={stop} onKeyDown={stop}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${d.title}`}
              className="grid size-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-9"
            >
              <EllipsisVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl" onClick={stop}>
            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onChange}>Change Deadline</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Mark as completed"
              onClick={onComplete}
              className="group/ring grid size-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-9"
            >
              <span className="grid size-6 place-items-center rounded-full border-2 border-input transition-colors group-hover/ring:border-urgent-green group-hover/ring:bg-urgent-green-tint">
                <Check className="size-3 text-urgent-green opacity-0 transition-opacity group-hover/ring:opacity-100" />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Mark as completed</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
