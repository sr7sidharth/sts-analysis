"use client";

import { useCallback, useEffect, useState } from "react";
import type { Run } from "@/types/run";
import { addRunsDeduped, loadRuns, saveRuns } from "@/lib/storage";
import { normalizeRun, parseRunFileText, RunParseError } from "@/lib/parser";

export type RunImportError = {
  fileName: string;
  message: string;
};

export type UseRunsResult = {
  runs: Run[];
  isLoading: boolean;
  addFiles: (files: File[]) => Promise<{ added: Run[]; errors: RunImportError[] }>;
  removeRun: (id: string) => void;
  clearAll: () => void;
};

export function useRuns(): UseRunsResult {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initial = loadRuns();
    setRuns(initial);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: StorageEvent) => {
      if (event.key === "sts_runs") {
        setRuns(loadRuns());
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const removeRun = useCallback((id: string) => {
    setRuns((prev) => {
      const next = prev.filter((run) => run.id !== id);
      saveRuns(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setRuns([]);
    saveRuns([]);
  }, []);

  const addFiles = useCallback(
    async (files: File[]): Promise<{ added: Run[]; errors: RunImportError[] }> => {
      setIsLoading(true);
      const errors: RunImportError[] = [];
      const parsedRuns: Run[] = [];

      const readFile = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(typeof reader.result === "string" ? reader.result : "");
          };
          reader.onerror = () => {
            reject(new Error("Failed to read file"));
          };
          reader.readAsText(file);
        });

      for (const file of files) {
        try {
          const text = await readFile(file);
          const raw = parseRunFileText(text);
          const run = normalizeRun(raw as any);
          parsedRuns.push(run);
        } catch (error) {
          if (error instanceof RunParseError) {
            errors.push({ fileName: file.name, message: error.message });
          } else {
            errors.push({
              fileName: file.name,
              message: "Unknown error parsing run file.",
            });
          }
        }
      }

      // Compute merge outside of setState to avoid issues with dev-mode
      // double-invocation of state updaters.
      const existing = loadRuns();
      const { merged, added } = addRunsDeduped(existing, parsedRuns);
      saveRuns(merged);
      setRuns(merged);

      setIsLoading(false);
      return { added, errors };
    },
    [],
  );

  return {
    runs,
    isLoading,
    addFiles,
    removeRun,
    clearAll,
  };
}

