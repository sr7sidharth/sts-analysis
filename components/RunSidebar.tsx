"use client";

import Link from "next/link";
import type { Run } from "@/types/run";

type RunSidebarProps = {
  runs: Run[];
  activeRunId?: string;
  onDeleteRun?: (id: string) => void;
  activeCharacter?: string;
};

export function RunSidebar({
  runs,
  activeRunId,
  onDeleteRun,
  activeCharacter,
}: RunSidebarProps) {
  if (runs.length === 0) {
    return (
      <aside className="w-64 border-r border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
        <p>No runs loaded yet.</p>
        <p className="mt-1">Upload files on the home page to get started.</p>
      </aside>
    );
  }

  const visibleRuns =
    activeCharacter != null
      ? runs.filter((run) => run.character === activeCharacter)
      : runs;

  if (visibleRuns.length === 0) {
    return (
      <aside className="w-64 border-r border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
        <p>No runs for this character yet.</p>
        <p className="mt-1">Try switching characters in the overview filters.</p>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Runs
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {visibleRuns.map((run) => {
            const isActive = run.id === activeRunId;
            return (
              <li key={run.id}>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/run/${run.id}`}
                    className={`flex-1 rounded-md px-2 py-2 text-xs transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-zinc-50"
                        : "text-zinc-800 hover:bg-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{run.character}</span>
                      <span className="text-[10px] text-zinc-500">
                        A{run.ascensionLevel}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[11px] text-zinc-600">
                      <span>Floor {run.floorReached}</span>
                      <span>
                        {run.victory
                          ? "Win"
                          : run.killedBy
                            ? `Died to ${run.killedBy}`
                            : "Loss"}
                      </span>
                    </div>
                  </Link>
                  {onDeleteRun && (
                    <button
                      type="button"
                      aria-label="Delete run"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-[11px] text-zinc-500 hover:bg-red-50 hover:text-red-700"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onDeleteRun(run.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

