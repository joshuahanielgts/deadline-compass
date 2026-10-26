import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Deadline } from "@/lib/types";
import { api, errMsg } from "@/lib/api";
import { fmtShort } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/deadlines/Dialogs";
import { EmptyState, ErrorPanel, LoadingGrid, PageHeader } from "@/components/PageStates";

export default function PreviousDeadlines({ onRestored }: { onRestored: (d: Deadline) => void }) {
  const [items, setItems] = useState<Deadline[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Deadline | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      setItems(await api.listCompleted());
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const restore = async (d: Deadline) => {
    setBusy(d.id);
    try {
      const r = await api.restore(d.id);
      setItems((xs) => xs?.filter((x) => x.id !== d.id) ?? null);
      onRestored(r);
      toast.success("Restored to active deadlines");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Previous deadlines" subtitle="Things you've already finished, most recent first." />
      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : !items ? (
        <LoadingGrid />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing completed yet" />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-card">
          {items.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 p-4 animate-fade-up sm:flex-row sm:items-center sm:p-5">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold break-words">{d.title}</h3>
                {d.shortDescription && (
                  <p className="mt-0.5 text-sm text-muted-foreground break-words">{d.shortDescription}</p>
                )}
                <p className="tabular mt-1.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  <span>Due {fmtShort(d.dueAt)}</span>
                  {d.completedAt && <span>Completed {fmtShort(d.completedAt)}</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" className="h-11" disabled={busy === d.id} onClick={() => restore(d)}>
                  Restore
                </Button>
                <Button variant="ghost" className="h-11 text-destructive hover:text-destructive" onClick={() => setToDelete(d)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DeleteDialog
        deadline={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(d) => setItems((xs) => xs?.filter((x) => x.id !== d.id) ?? null)}
      />
    </>
  );
}
