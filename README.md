# STS Run Analyzer

A client-side web app for analyzing your **Slay the Spire** run logs. Upload your `.run` files, explore individual runs, and view aggregate stats across your entire history — all stored locally in your browser with no backend required.

## Features

- **Aggregate insights** — win rate, average floor, card pick rates, relic occurrence, death breakdown, encounter averages, shop stats, and removed card stats across all your runs
- **Single-run view** — final deck with card coloring (added / starting / upgraded), relics, card decisions, path overview with shop purchases inline, and gold per floor
- **Daily Challenge support** — daily runs are identified automatically and their modifiers are displayed; they are excluded from aggregate stats by default with a toggle to include them
- **Filters** — filter aggregate stats by character, ascension level, result (wins/losses), and daily runs
- **Run management** — upload multiple files at once, delete individual runs, or clear all

## Getting Your Run Files

Slay the Spire saves run logs automatically. On Steam, they are located at:

- **Windows:** `%APPDATA%\SlayTheSpire\runs\`
- **macOS:** `~/Library/Application Support/SlayTheSpire/runs/`
- **Linux:** `~/.local/share/SlayTheSpire/runs/`

Each subfolder (`IRONCLAD`, `THE_SILENT`, `DEFECT`, `WATCHER`, `DAILY`) contains individual `.run` files.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag and drop your `.run` files onto the upload zone to get started.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, all client components)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- `localStorage` for persistence — no database, no backend, no accounts

## STS2

STS2 support will be added once the game is live and its run log format is documented. The codebase already has a detection hook in `lib/parser.ts` (`detectGame`) ready for extension.

## Deployment

Deploy to [Vercel](https://vercel.com) with zero configuration — no environment variables needed. Connect your repo and deploy.
