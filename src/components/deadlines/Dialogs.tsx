import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { Deadline, Settings } from "@/lib/types";
import { api, errMsg } from "@/lib/api";
import { countdownText, fmtLong, getUrgency, urgencyLabel } from "@/lib/time";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "./DateTimePicker";
import { urgencyStyles } from "./urgency";

const FieldError = ({ msg, id }: { msg?: string; id?: string }) =>
  msg ? (
    <p id={id} className="mt-1 text-xs text-destructive">
      {msg}
    </p>
  ) : null;

const ServerError = ({ msg }: { msg: string | null }) =>
  msg ? (
    <div role="alert" className="rounded-xl bg-urgent-red-tint px-3 py-2 text-sm text-urgent-red-ink">
      {msg}
    </div>
  ) : null;

/* ---------------- Add ---------------- */
export function AddDeadlineDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (d: Deadline) => void;
}) {
  const [title, setTitle] = useState("");
  const [short, setShort] = useState("");
  const [long, setLong] = useState("");
  const [due, setDue] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setShort("");
      setLong("");
      setDue(undefined);
      setErrors({});
      setServerError(null);
    }
  }, [open]);

  const dirty = !!(title || short || long || due);
  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirm(true);
    else onOpenChange(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const t = title.trim();
    if (!t) e.title = "Title is required.";
    else if (t.length > 150) e.title = "Title must be 150 characters or fewer.";
    if (short.length > 200) e.short = "Short description must be 200 characters or fewer.";
    if (long.length > 5000) e.long = "Details must be 5000 characters or fewer.";
    if (!due) e.due = "Pick a due date and time.";
    else if (due.getTime() <= Date.now()) e.due = "Due date must be in the future.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (saving || !validate()) return;
    setSaving(true);
    setServerError(null);
    try {
      const d = await api.create({
        title: title.trim(),
        shortDescription: short.trim() || undefined,
        longDescription: long.trim() || undefined,
        dueAt: due!.toISOString(),
      });
      onCreated(d);
      onOpenChange(false);
      toast.success("Deadline added");
    } catch (e) {
      setServerError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
        <DialogContent className="w-[calc(100%-1.5rem)] gap-0 p-0 sm:max-w-[640px] [&>button:last-child]:hidden">
          <form
            className="flex flex-col gap-4 p-5 sm:p-7"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            noValidate
          >
            <DialogDescription className="sr-only">Create a new deadline</DialogDescription>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <DialogTitle className="sr-only">Add deadline</DialogTitle>
                <label htmlFor="add-title" className="sr-only">
                  Title
                </label>
                <input
                  id="add-title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's due?"
                  maxLength={300}
                  aria-invalid={!!errors.title}
                  aria-describedby="add-title-err"
                  className="w-full bg-transparent font-serif text-3xl leading-tight placeholder:text-muted-foreground/60 focus:outline-none sm:text-4xl"
                />
                <FieldError id="add-title-err" msg={errors.title} />
              </div>
              <div className="sm:pt-1">
                <DateTimePicker value={due} onChange={setDue} invalid={!!errors.due} />
                <FieldError msg={errors.due} />
              </div>
            </div>
            <div>
              <label htmlFor="add-short" className="sr-only">
                Short description
              </label>
              <Input
                id="add-short"
                value={short}
                onChange={(e) => setShort(e.target.value)}
                placeholder="Short description (optional)"
                aria-invalid={!!errors.short}
                className="h-11"
              />
              <FieldError msg={errors.short} />
            </div>
            <div>
              <label htmlFor="add-long" className="sr-only">
                Details
              </label>
              <Textarea
                id="add-long"
                value={long}
                onChange={(e) => setLong(e.target.value)}
                placeholder="Details, links, notes… (optional)"
                aria-invalid={!!errors.long}
                className="min-h-40 resize-y"
              />
              <div className="mt-1 flex justify-between">
                <FieldError msg={errors.long} />
                <span className="tabular ml-auto text-xs text-muted-foreground">{long.length}/5000</span>
              </div>
            </div>
            <ServerError msg={serverError} />
            <div className="flex items-center justify-between pt-1">
              <Button type="button" variant="ghost" onClick={requestClose} className="h-11">
                <X /> Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-11 px-6">
                {saving && <Loader2 className="animate-spin" />} Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-normal">Discard this deadline?</AlertDialogTitle>
            <AlertDialogDescription>What you've typed will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onOpenChange(false)}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ---------------- Change due date ---------------- */
export function ChangeDeadlineDialog({
  deadline,
  onClose,
  onSaved,
}: {
  deadline: Deadline | null;
  onClose: () => void;
  onSaved: (d: Deadline) => void;
}) {
  const [due, setDue] = useState<Date | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deadline) {
      setDue(new Date(deadline.dueAt));
      setError(null);
    }
  }, [deadline]);

  const save = async () => {
    if (!deadline || !due || saving) return;
    setSaving(true);
    setError(null);
    try {
      const d = await api.changeDueDate(deadline.id, due.toISOString());
      onSaved(d);
      onClose();
      toast.success("Deadline updated");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!deadline} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[420px]">
        <DialogTitle className="font-serif text-2xl font-normal">Change deadline</DialogTitle>
        <DialogDescription className="line-clamp-2 break-words text-foreground">{deadline?.title}</DialogDescription>
        <div>
          <DateTimePicker value={due} onChange={setDue} />
          <p className="mt-2 text-xs text-muted-foreground">
            Past dates are allowed; the deadline will show as overdue.
          </p>
        </div>
        <ServerError msg={error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="h-11">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !due} className="h-11 px-6">
            {saving && <Loader2 className="animate-spin" />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Detail ---------------- */
export function DetailDialog({
  deadline,
  now,
  settings,
  onClose,
  onChange,
  onComplete,
}: {
  deadline: Deadline | null;
  now: number;
  settings: Settings;
  onClose: () => void;
  onChange: (d: Deadline) => void;
  onComplete: (d: Deadline) => void;
}) {
  const d = deadline;
  const u = d ? getUrgency(d.dueAt, now, settings) : "green";
  return (
    <Dialog open={!!d} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-[600px]">
        {d && (
          <>
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", urgencyStyles[u].pill)}>
                {urgencyLabel[u]} · <span className="tabular">{countdownText(d.dueAt, now)}</span>
              </span>
            </div>
            <DialogTitle className="font-serif text-3xl font-normal leading-tight break-words">{d.title}</DialogTitle>
            <DialogDescription className="tabular">Due {fmtLong(d.dueAt)}</DialogDescription>
            {d.shortDescription && <p className="break-words">{d.shortDescription}</p>}
            <div className="rounded-xl bg-muted/60 p-4 text-sm">
              {d.longDescription ? (
                <p className="whitespace-pre-wrap break-words">{d.longDescription}</p>
              ) : (
                <p className="text-muted-foreground">No additional details</p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => onChange(d)} className="h-11">
                Change Deadline
              </Button>
              <Button onClick={() => onComplete(d)} className="h-11">
                Mark as completed
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Delete ---------------- */
export function DeleteDialog({
  deadline,
  onClose,
  onDeleted,
}: {
  deadline: Deadline | null;
  onClose: () => void;
  onDeleted: (d: Deadline) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [deadline]);

  const confirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deadline || busy) return;
    setBusy(true);
    try {
      await api.remove(deadline.id);
      onDeleted(deadline);
      onClose();
      toast.success("Deadline deleted");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={!!deadline} onOpenChange={(o) => !o && !busy && onClose()}>
      <AlertDialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl font-normal break-words">
            Delete “{deadline?.title}”?
          </AlertDialogTitle>
          <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <ServerError msg={error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy && <Loader2 className="animate-spin" />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
