import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { DEFAULT_SETTINGS, type Deadline, type Settings } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar, type View } from "@/components/AppSidebar";
import { AddDeadlineDialog, ChangeDeadlineDialog, DeleteDialog, DetailDialog } from "@/components/deadlines/Dialogs";
import ListDeadlines from "@/pages/ListDeadlines";
import DeadlineSettings from "@/pages/DeadlineSettings";
import PreviousDeadlines from "@/pages/PreviousDeadlines";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deadline Manager — keep every due date in view" },
      { name: "description", content: "A quiet, focused tracker for your deadlines with live countdowns and urgency colours." },
      { property: "og:title", content: "Deadline Manager" },
      { property: "og:description", content: "A quiet, focused tracker for your deadlines with live countdowns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const byDue = (a: Deadline, b: Deadline) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();

function App() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<View>("list");
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const expanded = isMobile ? mobileOpen : desktopOpen;

  const [now, setNow] = useState(() => Date.now());
  const [active, setActive] = useState<Deadline[] | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<Set<number>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Deadline | null>(null);
  const [changing, setChanging] = useState<Deadline | null>(null);
  const [deleting, setDeleting] = useState<Deadline | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setActive(null);
    try {
      const [list, s] = await Promise.all([api.listActive(), api.getSettings()]);
      setActive(list);
      setSettings(s);
    } catch (e) {
      setLoadError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    load();
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 60_000);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const upsert = (d: Deadline) =>
    setActive((xs) => [...(xs ?? []).filter((x) => x.id !== d.id), d].sort(byDue));
  const removeLater = (id: number) => {
    setLeaving((s) => new Set(s).add(id));
    setTimeout(() => {
      setActive((xs) => xs?.filter((x) => x.id !== id) ?? null);
      setLeaving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, 220);
  };

  const complete = async (d: Deadline) => {
    try {
      await api.complete(d.id);
      setDetail(null);
      removeLater(d.id);
      toast.success("Marked as completed");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const go = (v: View) => {
    setView(v);
    if (isMobile) setMobileOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen overflow-x-hidden">
        <AppSidebar
          view={view}
          onView={go}
          expanded={expanded}
          isMobile={isMobile}
          onToggle={() => (isMobile ? setMobileOpen((o) => !o) : setDesktopOpen((o) => !o))}
        />
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            className={cn(
              "fixed left-3 top-3 z-20 grid size-11 place-items-center rounded-xl border bg-card shadow-card transition-opacity",
              mobileOpen && "opacity-0",
            )}
          >
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1 rounded-full bg-foreground" />
              ))}
            </span>
          </button>
        )}
        <main
          className={cn(
            "transition-[padding] duration-250 ease-out",
            isMobile ? "pl-0" : desktopOpen ? "pl-[264px]" : "pl-16",
          )}
        >
          <div className="mx-auto max-w-[1200px] px-5 pb-32 pt-20 sm:px-8 md:pt-14">
            {view === "list" && (
              <ListDeadlines
                deadlines={active}
                error={loadError}
                onRetry={load}
                now={now}
                settings={settings}
                leaving={leaving}
                onOpen={setDetail}
                onDelete={setDeleting}
                onChange={setChanging}
                onComplete={complete}
              />
            )}
            {view === "settings" && <DeadlineSettings settings={settings} onSaved={setSettings} />}
            {view === "previous" && <PreviousDeadlines onRestored={upsert} />}
          </div>
        </main>

        <button
          type="button"
          aria-label="Add deadline"
          onClick={() => setAddOpen(true)}
          className={cn(
            "fixed bottom-6 z-20 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition-all duration-250 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isMobile ? "left-5" : desktopOpen ? "left-[calc(264px+1.5rem)]" : "left-[calc(4rem+1.5rem)]",
            isMobile && mobileOpen && "pointer-events-none scale-90 opacity-0",
          )}
        >
          <Plus className="size-6" />
        </button>

        <AddDeadlineDialog open={addOpen} onOpenChange={setAddOpen} onCreated={upsert} />
        <DetailDialog
          deadline={detail}
          now={now}
          settings={settings}
          onClose={() => setDetail(null)}
          onChange={(d) => {
            setDetail(null);
            setChanging(d);
          }}
          onComplete={complete}
        />
        <ChangeDeadlineDialog deadline={changing} onClose={() => setChanging(null)} onSaved={upsert} />
        <DeleteDialog deadline={deleting} onClose={() => setDeleting(null)} onDeleted={(d) => removeLater(d.id)} />
      </div>
    </TooltipProvider>
  );
}
