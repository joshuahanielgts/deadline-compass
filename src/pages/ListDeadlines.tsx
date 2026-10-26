import type { Deadline, Settings } from "@/lib/types";
import { DeadlineCard } from "@/components/deadlines/DeadlineCard";
import { EmptyState, ErrorPanel, LoadingGrid, PageHeader } from "@/components/PageStates";

interface Props {
  deadlines: Deadline[] | null;
  error: string | null;
  onRetry: () => void;
  now: number;
  settings: Settings;
  leaving: Set<number>;
  onOpen: (d: Deadline) => void;
  onDelete: (d: Deadline) => void;
  onChange: (d: Deadline) => void;
  onComplete: (d: Deadline) => void;
}

export default function ListDeadlines(p: Props) {
  return (
    <>
      <PageHeader title="Deadlines" subtitle="Everything still ahead of you, soonest first." />
      {p.error ? (
        <ErrorPanel message={p.error} onRetry={p.onRetry} />
      ) : !p.deadlines ? (
        <LoadingGrid />
      ) : p.deadlines.length === 0 ? (
        <EmptyState title="No deadlines yet" subtitle="Add one with the + button to get started" />
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr))]">
          {p.deadlines.map((d) => (
            <DeadlineCard
              key={d.id}
              deadline={d}
              now={p.now}
              settings={p.settings}
              leaving={p.leaving.has(d.id)}
              onOpen={() => p.onOpen(d)}
              onDelete={() => p.onDelete(d)}
              onChange={() => p.onChange(d)}
              onComplete={() => p.onComplete(d)}
            />
          ))}
        </div>
      )}
    </>
  );
}
