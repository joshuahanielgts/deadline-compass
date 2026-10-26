# Deadline Compass

# Lovable — LEAN credit plan

## Credit rules
1. Send the ONE prompt below. Do not paste the knowledge block or any follow-up audit prompts from the long version.
2. Review the preview yourself. Collect every defect into ONE fix message (template at the bottom). Never send "make it prettier" or other vague requests.
3. Connect GitHub right after the first build. Do everything else (tests, accessibility, polish, real API wiring) in Antigravity/VS Code on the exported code, which costs no Lovable credits.
4. Do not connect Supabase or enable Lovable Cloud.
5. Target: 1 build message + at most 1 fix message.

---

## THE PROMPT (send once)

```
Build the FRONTEND ONLY of "Deadline Manager": a minimal, polished single-user deadline tracker. React + TypeScript + Tailwind + shadcn/ui. Deliver everything in this one pass; keep the code compact and readable.

RULES
- No Supabase, no Lovable Cloud, no auth, no backend, no extra dependencies beyond shadcn, date-fns, sonner, lucide-react.
- All data goes through src/lib/api.ts, which calls import.meta.env.VITE_API_BASE_URL (fallback http://localhost:8080). If VITE_USE_MOCK=true (set it in .env.development), api.ts instead uses a minimal in-memory + localStorage mock. The mock starts EMPTY (never seed deadlines) and shows a small "Mock data" pill in the sidebar footer. Add .env.example with both variables.
- Never use dangerouslySetInnerHTML. No hard-coded colours in components; use semantic tokens only.
- Urgency colour is DERIVED at render time from dueAt + settings; never stored on data.
- UI updates only after the server call succeeds (no optimistic updates). Failures show a toast/inline error and leave state unchanged.

API CONTRACT (src/lib/api.ts, typed functions)
GET /api/deadlines/active (sorted dueAt asc) · GET /api/deadlines/completed (sorted completedAt desc) · POST /api/deadlines {title, shortDescription?, longDescription?, dueAt} · PATCH /api/deadlines/{id}/due-date {dueAt} · POST /api/deadlines/{id}/complete · POST /api/deadlines/{id}/restore · DELETE /api/deadlines/{id} · GET/PUT /api/settings
Types: Deadline {id:number; title; shortDescription:string|null; longDescription:string|null; dueAt:string(ISO UTC); completed:boolean; createdAt:string; completedAt:string|null}. Settings {redThresholdHours:number; yellowThresholdHours:number} (defaults 24 and 72).
One fetch helper: JSON in/out; non-2xx errors parsed from body {message, fieldErrors?}; network failure shows "Cannot reach the server". Convert datetime picker values with new Date(local).toISOString(); display in local time.

DESIGN — "quiet editorial"
Warm paper background (~hsl(40 30% 96%)), near-white cards, warm ink text, one restrained deep ink-blue accent (~hsl(222 38% 28%)) for primary buttons/focus/active nav. Fonts via Google Fonts: "Instrument Serif" for page titles, empty states and dialog titles; "Inter Tight" for UI; tabular numerals for dates/countdowns. Radii: cards 16px, dialogs 20px, inputs/buttons 12px. Soft warm-tinted layered shadows. Generous spacing. Light theme only.
Urgency tokens (solid + 10% tint + AA-contrast text each): red brick (~hsl(8 68% 46%)), yellow amber (~hsl(38 88% 44%)), green sage (~hsl(146 34% 36%)). Define all as HSL variables in index.css and map in tailwind config. Must not look like a default shadcn template.
Motion: CSS transitions only (160-300ms, ease-out): sidebar width, FAB shift, dialog open/close, card fade-up on enter, subtle hover lift on hover-capable devices. Wrap in prefers-reduced-motion so motion is disabled for those users.

LAYOUT
- Left collapsible sidebar. Toggle button at top uses a HORIZONTAL three-dot icon (lucide Ellipsis), aria-expanded. Collapsed = 64px rail (toggle + three icons with tooltips); expanded = 264px with labels. Smooth width animation; labels fade in so text never clips. EXACTLY three sections: "List Deadlines", "Deadline Settings", "Previous Deadlines". Active item = tinted pill + 3px accent bar. Client-side view switching (no reload). Default view: List Deadlines. Under 768px the sidebar is an overlay drawer with backdrop, closed by default.
- Main workspace: serif page title + muted one-line subtitle; content max-width ~1200px; cards in grid repeat(auto-fill, minmax(300px,1fr)).
- Floating "+" button bottom-LEFT (56px, accent, aria-label "Add deadline"). When the sidebar is expanded on desktop it slides right to clear it (animated); on mobile it hides while the drawer is open. Add bottom page padding so it never covers the last card.

ACTIVE CARDS
Rectangular card; 4px left rail in urgency colour; whole card clickable (keyboard focusable) -> opens a read-only detail dialog.
- Top row: due date on the LEFT (small, muted, e.g. "Mon, 3 Nov · 6:30 PM"); countdown pill on the RIGHT (urgency tint bg, readable, smaller than the title).
- Middle: title (600, ~18px, max 2 lines) with short description under it (muted, max 2 lines; omit if empty).
- Right-side column: a VERTICAL three-dot menu button (lucide EllipsisVertical) with a dropdown containing EXACTLY "Delete" and "Change Deadline"; below it a circular "mark completed" ring button (tooltip + aria-label "Mark as completed"). Menu clicks must not trigger the card click; opening one menu closes others.
- Visually-hidden urgency text for screen readers ("Urgent", "Due soon", "On track", "Overdue").
Detail dialog: serif title, urgency pill + countdown, full due date/time, short description, and the LONG description (whitespace-pre-wrap, plain text; muted "No additional details" if empty). Buttons: "Change Deadline" and "Mark as completed".
Completing: call complete; on success remove the card (short fade-out) + toast "Marked as completed".

TIME + URGENCY (pure functions in src/lib/time.ts, taking `now` as a parameter, using absolute milliseconds)
Countdown text: >=1 day "2 days left" / "1 day 4 hours left" (omit zero hours, correct singular/plural); <1 day and >=1h "5 hours left"; <1h and >0 "Less than an hour left"; overdue "Overdue by 2d 3h" / "Overdue by 3 hours" / "Overdue by less than an hour". Never show a positive countdown for a past deadline.
Urgency: remaining<=0 -> overdue (red styling); <= redThresholdHours -> red; <= yellowThresholdHours -> yellow; else green.
Keep a single `now` state refreshed with setInterval every 60s (and on tab visibility); it re-renders countdowns and colours WITHOUT refetching from the API.

ADD DIALOG (opened by "+")
Wide dialog (~640px). Layout: date-time picker at TOP-RIGHT (shadcn Popover + Calendar + time input, showing a compact pill); large borderless serif TITLE input top-left (placeholder "What's due?"); short description input below it (<=200); large long-description textarea (<=5000); bottom row: "X Cancel" on the left, "Save" on the right.
Validation (inline): title required 1-150; due date required and in the future; length caps. Save calls create; shows spinner and prevents double-submit; on success close, toast "Deadline added", card appears in correct dueAt order. On failure show the server message INSIDE the dialog, keep input, stay open. Cancel/Esc/backdrop: if any input exists confirm "Discard this deadline?" (AlertDialog); else close. No request on cancel.

CHANGE DEADLINE DIALOG
Small dialog (~420px): read-only title, date-time picker prefilled with the current due date, helper text "Past dates are allowed; the deadline will show as overdue.", Cancel and Save. Save calls the PATCH; on success update date, countdown, colour and sort order; title/descriptions unchanged. On failure inline error, stay open.

DELETE
AlertDialog: "Delete “{title}”? This can't be undone." Remove the card only after success; on failure show error and keep it.

DEADLINE SETTINGS VIEW
Red group and Yellow group, each with Days (0-365) and Hours (0-23) inputs and a one-line explanation. Green is NOT editable: a read-only card that live-updates "Everything due in more than {yellow threshold} stays green." Short "How it works" text. Convert days+hours <-> total hours for state/payload. Validation: integers, red > 0, yellow > red, yellow <= 8760 hours; clear inline messages; Save disabled while invalid/unchanged. Buttons: "Reset to defaults" (fills 1 day / 3 days, still requires Save) and "Save settings". On success toast and recolour all cards immediately without refetching deadlines. On failure show server message and keep values.

PREVIOUS DEADLINES VIEW
Completed items in the exact API order (completedAt desc; no client re-sort). Each row: title, short description, "Due {original due date}", "Completed {date}", and quiet "Restore" (moves back to active) and "Delete" (same confirm) actions. Refetch when the view opens.

STATES
- No active deadlines: serif "No deadlines yet", muted "Add one with the + button to get started", plus a small original inline-SVG calendar illustration. NO fake data.
- Empty history: serif "Nothing completed yet".
- Loading: simple "Loading…" skeleton blocks. Backend unreachable/error on load: an inline error panel (not the empty state) with a "Try again" button.
- Toasts via sonner; success/error; never cover the FAB.
- Accessible: real buttons, aria-labels on icon buttons, dialogs trap focus and close on Esc, AA contrast, works 360-1920px with no horizontal scroll, touch targets >=44px on mobile.

DO NOT add: search, reminders, recurring deadlines, dark mode, drag-and-drop, full edit of existing deadlines, tests, or anything not listed. Organise code as src/lib/{api,types,time}.ts, src/components/..., src/pages/{ListDeadlines,DeadlineSettings,PreviousDeadlines}.tsx. When done, list anything you could not implement.
```

---

## The ONE fix message (template)
Fill in only what you actually found in the preview. Delete lines that don't apply.

```
Fix exactly these issues in one pass and change nothing else:
1. [page/component] — [what is wrong] — [what it should do]
2. ...
3. ...
```

## What moves to Antigravity (free of Lovable credits)
- Unit tests for `time.ts` (boundary cases), keyboard/accessibility audit, mobile 375px audit, XSS test with a hostile title, reduced-motion check
- Visual polish and token tweaks
- Switching `VITE_USE_MOCK=false` and verifying against the real Spring Boot API
- Removing the mock adapter once the backend is verified

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e70699c0-8cef-402a-ac65-7789987a2f7c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
