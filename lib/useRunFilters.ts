"use client";

import { useCallback, useMemo, useState } from "react";
import { filterRuns } from "@/lib/analytics";
import type { Run, RunFilters } from "@/types/run";

export type UseRunFiltersResult = {
  filters: RunFilters;
  setCharacter: (character: string | undefined) => void;
  setAscension: (ascension: number | undefined) => void;
  setResult: (result: RunFilters["result"]) => void;
  setIncludeDailies: (include: boolean) => void;
  resetFilters: () => void;
  filteredRuns: Run[];
  characters: string[];
  ascensions: number[];
  hasDailyRuns: boolean;
};

export function useRunFilters(runs: Run[]): UseRunFiltersResult {
  const [filters, setFilters] = useState<RunFilters>({});

  const characters = useMemo(
    () => Array.from(new Set(runs.map((r) => r.character))).sort(),
    [runs],
  );

  const ascensions = useMemo(
    () =>
      Array.from(new Set(runs.map((r) => r.ascensionLevel))).sort(
        (a, b) => a - b,
      ),
    [runs],
  );

  const hasDailyRuns = useMemo(
    () => runs.some((r) => r.isDaily),
    [runs],
  );

  const filteredRuns = useMemo(
    () => filterRuns(runs, filters),
    [runs, filters],
  );

  const setCharacter = useCallback((character: string | undefined) => {
    setFilters((prev) => ({ ...prev, character }));
  }, []);

  const setAscension = useCallback((ascension: number | undefined) => {
    setFilters((prev) => ({ ...prev, ascension }));
  }, []);

  const setResult = useCallback((result: RunFilters["result"]) => {
    setFilters((prev) => ({ ...prev, result }));
  }, []);

  const setIncludeDailies = useCallback((include: boolean) => {
    setFilters((prev) => ({ ...prev, includeDailies: include || undefined }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    setCharacter,
    setAscension,
    setResult,
    setIncludeDailies,
    resetFilters,
    filteredRuns,
    characters,
    ascensions,
    hasDailyRuns,
  };
}
