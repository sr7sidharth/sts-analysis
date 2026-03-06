"use client";

import { useEffect, useMemo, useState } from "react";
import { RunSidebar } from "@/components/RunSidebar";
import { AggregateInsights } from "@/components/Insights/AggregateInsights";
import { useRuns } from "@/lib/useRuns";
import type { GameId } from "@/types/run";

export default function OverviewPage() {
  const { runs, removeRun, clearAll } = useRuns();
  const [activeCharacter, setActiveCharacter] = useState<string | undefined>(undefined);

  const gamesPresent = useMemo(
    () =>
      Array.from(new Set(runs.map((r) => r.game))).filter(
        (g): g is GameId => g === "STS1" || g === "STS2",
      ),
    [runs],
  );

  const [activeGame, setActiveGame] = useState<GameId | undefined>(undefined);

  useEffect(() => {
    if (runs.length === 0) {
      setActiveGame(undefined);
      return;
    }

    // Initialise or repair activeGame when runs/games change.
    if (!activeGame) {
      if (gamesPresent.includes("STS1")) {
        setActiveGame("STS1");
      } else if (gamesPresent.includes("STS2")) {
        setActiveGame("STS2");
      }
      return;
    }

    if (!gamesPresent.includes(activeGame)) {
      if (gamesPresent.includes("STS1")) {
        setActiveGame("STS1");
      } else if (gamesPresent.includes("STS2")) {
        setActiveGame("STS2");
      } else {
        setActiveGame(undefined);
      }
    }
  }, [runs.length, gamesPresent, activeGame]);

  const runsForActiveGame =
    activeGame != null ? runs.filter((run) => run.game === activeGame) : runs;

  if (runs.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-6 py-6 text-sm text-zinc-700">
          <h1 className="mb-2 text-lg font-semibold text-zinc-900">
            No runs loaded
          </h1>
          <p>
            Upload one or more <span className="font-mono">.run</span> or{" "}
            <span className="font-mono">.json</span> files on the home page to
            see aggregate insights.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-zinc-50">
      <RunSidebar
        runs={runsForActiveGame}
        onDeleteRun={removeRun}
        activeCharacter={activeCharacter}
      />
      <section className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-3">
            <span>
              {runsForActiveGame.length} runs stored for analysis
              {activeGame ? ` (${activeGame})` : ""}.
            </span>
            {gamesPresent.length > 1 && (
              <div className="inline-flex overflow-hidden rounded-full border border-zinc-300 bg-white">
                {(["STS1", "STS2"] as const).map((game) => {
                  const enabled = gamesPresent.includes(game);
                  const isActive = activeGame === game;
                  const baseClasses =
                    "px-3 py-1 text-[11px] font-semibold transition-colors";
                  const stateClasses = !enabled
                    ? "cursor-not-allowed text-zinc-300 bg-zinc-50"
                    : isActive
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-100";
                  return (
                    <button
                      key={game}
                      type="button"
                      disabled={!enabled}
                      onClick={() => enabled && setActiveGame(game)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      {game}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "This will permanently remove all locally stored runs from this browser. This cannot be undone.\n\nDo you want to delete all runs?",
                )
              ) {
                clearAll();
              }
            }}
            className="rounded-full border border-red-300 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50"
          >
            Delete all runs
          </button>
        </div>
        <AggregateInsights
          runs={runsForActiveGame}
          onSelectedCharacterChange={setActiveCharacter}
        />
      </section>
    </main>
  );
}
