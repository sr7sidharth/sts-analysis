"use client";

import { useState } from "react";
import { RunSidebar } from "@/components/RunSidebar";
import { AggregateInsights } from "@/components/Insights/AggregateInsights";
import { useRuns } from "@/lib/useRuns";

export default function OverviewPage() {
  const { runs, removeRun, clearAll } = useRuns();
  const [activeCharacter, setActiveCharacter] = useState<string | undefined>(undefined);

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
    <main className="flex min-h-screen bg-zinc-50">
      <RunSidebar
        runs={runs}
        onDeleteRun={removeRun}
        activeCharacter={activeCharacter}
      />
      <section className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-600">
          <span>{runs.length} runs stored for analysis.</span>
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
          runs={runs}
          onSelectedCharacterChange={setActiveCharacter}
        />
      </section>
    </main>
  );
}
