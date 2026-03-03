"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { RunSidebar } from "@/components/RunSidebar";
import { SingleRunInsights } from "@/components/Insights/SingleRunInsights";
import { useRuns } from "@/lib/useRuns";

export default function RunPage() {
  const params = useParams<{ runId: string }>();
  const router = useRouter();
  const { runs, removeRun } = useRuns();

  const run = useMemo(
    () => runs.find((r) => r.id === params.runId),
    [runs, params.runId],
  );

  if (!run) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-6 py-6 text-sm text-zinc-700">
          <h1 className="mb-2 text-lg font-semibold text-zinc-900">
            Run not found
          </h1>
          <p className="mb-4">
            This run is not available in local storage. It may have been
            cleared, or you opened this page in a fresh browser session.
          </p>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-full bg-zinc-900 px-3 py-1.5 font-semibold text-white hover:bg-zinc-800"
            >
              Back to upload
            </button>
            <button
              type="button"
              onClick={() => router.push("/run/overview")}
              className="rounded-full border border-zinc-300 px-3 py-1.5 font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              Overview
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-zinc-50">
      <RunSidebar
        runs={runs}
        activeRunId={run.id}
        activeCharacter={run.character}
        onDeleteRun={(id) => {
          removeRun(id);
          if (id === run.id) {
            router.push("/run/overview");
          }
        }}
      />
      <section className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-600">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-zinc-300 px-3 py-1.5 font-semibold text-zinc-800 hover:bg-zinc-100"
          >
            Upload runs
          </button>
          <button
            type="button"
            onClick={() => router.push("/run/overview")}
            className="rounded-full bg-zinc-900 px-3 py-1.5 font-semibold text-white hover:bg-zinc-800"
          >
            Overview
          </button>
        </div>
        <SingleRunInsights run={run} />
      </section>
    </main>
  );
}

