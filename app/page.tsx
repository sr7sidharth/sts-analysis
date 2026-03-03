"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { useRuns, type RunImportError } from "@/lib/useRuns";

export default function Home() {
  const router = useRouter();
  const { runs, isLoading, addFiles, clearAll } = useRuns();
  const [errors, setErrors] = useState<RunImportError[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setNotice(null);
    const { added, errors: importErrors } = await addFiles(files);
    setErrors(importErrors);

    if (added.length === 1) {
      router.push(`/run/${added[0].id}`);
      return;
    }

    if (added.length > 1) {
      router.push("/run/overview");
      return;
    }

    if (added.length === 0 && importErrors.length === 0) {
      setNotice("No new runs imported (duplicates were ignored).");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white px-6 py-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Slay the Spire Run Analyzer
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Drop your local <span className="font-mono">.run</span> or{" "}
            <span className="font-mono">.json</span> files to explore card
            choices, relic performance, and death stats. Everything stays on
            your machine.
          </p>
        </header>

        <UploadZone
          onFilesSelected={handleFilesSelected}
          isProcessing={isLoading}
          errors={errors}
        />

        <footer className="mt-6 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Stored runs:{" "}
            <span className="font-semibold text-zinc-700">
              {runs.length}
            </span>
          </span>
          <div className="flex flex-col items-end gap-1">
            {runs.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => clearAll()}
                  className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete all runs
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/run/overview")}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                >
                  Overview
                </button>
              </div>
            )}
            {notice && (
              <span className="text-[11px] text-zinc-600">
                {notice} If you&apos;re not redirected, click Overview.
              </span>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}

