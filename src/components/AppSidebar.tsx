import { CalendarClock, Ellipsis, History, SlidersHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { USE_MOCK } from "@/lib/api";
import { cn } from "@/lib/utils";

export type View = "list" | "settings" | "previous";

const items: { id: View; label: string; icon: typeof CalendarClock }[] = [
  { id: "list", label: "List Deadlines", icon: CalendarClock },
  { id: "settings", label: "Deadline Settings", icon: SlidersHorizontal },
  { id: "previous", label: "Previous Deadlines", icon: History },
];

interface Props {
  view: View;
  onView: (v: View) => void;
  expanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

export function AppSidebar({ view, onView, expanded, onToggle, isMobile }: Props) {
  const showLabels = expanded;
  return (
    <>
      {isMobile && (
        <div
          aria-hidden
          onClick={onToggle}
          className={cn(
            "fixed inset-0 z-30 bg-overlay transition-opacity duration-200",
            expanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r bg-sidebar transition-[width,transform] duration-250 ease-out",
          expanded ? "w-[264px]" : "w-16",
          isMobile && !expanded && "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-2.5">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Ellipsis className="size-5" />
          </button>
          <span
            className={cn(
              "whitespace-nowrap font-serif text-xl transition-opacity duration-200",
              showLabels ? "opacity-100 delay-100" : "opacity-0",
            )}
          >
            Deadline Manager
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2.5 pt-2" aria-label="Sections">
          {items.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            const btn = (
              <button
                type="button"
                onClick={() => onView(id)}
                aria-current={active ? "page" : undefined}
                aria-label={showLabels ? undefined : label}
                className={cn(
                  "relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary-tint font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {active && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />}
                <Icon className="size-5 shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-200",
                    showLabels ? "opacity-100 delay-100" : "opacity-0",
                  )}
                >
                  {label}
                </span>
              </button>
            );
            return showLabels ? (
              <div key={id}>{btn}</div>
            ) : (
              <Tooltip key={id}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        {USE_MOCK && (
          <div className="p-3">
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-full bg-urgent-yellow-tint px-2.5 text-[11px] font-medium whitespace-nowrap text-urgent-yellow-ink",
                !showLabels && "px-1.5",
              )}
              title="Using local mock data"
            >
              {showLabels ? "Mock data" : "Mock"}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
