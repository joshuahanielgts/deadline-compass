<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- All data access goes through src/lib/api.ts (VITE_USE_MOCK switches to the built-in localStorage mock) — keeps the real backend swappable.
- Urgency is derived at render time from dueAt + settings via pure functions in src/lib/time.ts — never stored on data.
- UI state changes only after the API call succeeds (no optimistic updates).
- Single `/` route switches views client-side; view components live in src/pages.
