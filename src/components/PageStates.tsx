import { Button } from "@/components/ui/button";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </header>
  );
}

export function LoadingGrid() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading…</p>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr))]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="font-serif text-2xl">Couldn't load</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline" className="mt-4 h-11">
        Try again
      </Button>
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center animate-fade-up">
      <svg viewBox="0 0 120 110" className="mb-6 w-28 text-muted-foreground" fill="none" aria-hidden>
        <rect x="14" y="20" width="92" height="78" rx="14" className="fill-card stroke-current" strokeWidth="2" />
        <path d="M14 42h92" className="stroke-current" strokeWidth="2" />
        <path d="M38 12v16M82 12v16" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
        <circle cx="42" cy="62" r="4" className="fill-current opacity-40" />
        <circle cx="60" cy="62" r="4" className="fill-current opacity-40" />
        <circle cx="78" cy="78" r="9" className="stroke-primary" strokeWidth="2.5" />
        <path d="M78 73v5l3 2" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2 className="font-serif text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
