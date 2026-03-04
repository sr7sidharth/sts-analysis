# Contributing

Thanks for your interest in contributing. This is a small client-side Next.js app — there's no backend, no database, and no build pipeline beyond the standard Next.js toolchain.

## Running Locally

```bash
npm install
npm run dev        # dev server at http://localhost:3000
npx tsc --noEmit   # type-check without building
npm run lint       # ESLint
```

## Project Structure

```
app/                        Next.js pages (all "use client")
  page.tsx                  Home / upload page
  run/overview/page.tsx     Aggregate insights page
  run/[runId]/page.tsx      Single-run detail page

components/
  RunSidebar.tsx            Collapsible run list sidebar
  ScrollableTable.tsx       Reusable scrollable table with sort support
  TopNav.tsx                Top navigation bar
  UploadZone.tsx            Drag-and-drop file upload
  Insights/
    AggregateInsights.tsx   All aggregate stats and filter controls
    SingleRunInsights.tsx   Per-run deck, path, card decisions, etc.

lib/
  analytics/
    helpers.ts              Private raw-field accessor functions (getRaw, getMasterDeckRaw, …)
    aggregate.ts            Aggregate compute functions (computeCardStats, filterRuns, …)
    run.ts                  Per-run functions (getFinalDeck, getPathOverview, …)
    index.ts                Barrel re-export — import from "@/lib/analytics"
  parser.ts                 JSON parsing, field validation, Run normalization
  storage.ts                localStorage read/write with field rehydration
  sortUtils.ts              SortState<T>, toggleSort, sortIndicator helpers
  useRunFilters.ts          Filter state hook (character, ascension, result, dailies)
  useRuns.ts                Run CRUD hook (load, add files, remove, clear)

types/
  run.ts                    All domain types — single source of truth
```

## Adding New Analytics

**Aggregate stats** (across many runs): add a `compute*` function to `lib/analytics/aggregate.ts` and re-export it from `lib/analytics/index.ts`.

**Per-run data** (for the single-run view): add a `get*` function to `lib/analytics/run.ts` and re-export it from `lib/analytics/index.ts`.

**Raw field access**: if you need a new raw JSON field, add a typed accessor to `lib/analytics/helpers.ts` following the same pattern as `getMasterDeckRaw`, `getRelicsRaw`, etc.

## Code Conventions

- Every file that uses React hooks, `useState`, `window`, or `localStorage` must have `"use client"` as its first line.
- There is no server-side code. Do not add API routes or server actions.
- `types/run.ts` is the single source of truth for domain types. Add new fields to `Run` there and rehydrate them in `lib/storage.ts` (for old stored runs) and `lib/parser.ts` (for newly parsed runs).
- Keep `lib/analytics/helpers.ts` functions private to the analytics module — do not re-export them from `index.ts`.

## STS2 Support

STS2 support is not yet implemented. When STS2's run log format is documented, the entry point is the `detectGame` function in `lib/parser.ts`. Extend it to detect STS2-specific keys and return `"STS2"`. The `filterRuns` function in `lib/analytics/aggregate.ts` already gates analytics to STS1 and will need updating once STS2 analytics are ready.
