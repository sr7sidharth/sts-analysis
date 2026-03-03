"use client";

import { useMemo, useState } from "react";
import type { Run, RunFilters } from "@/types/run";
import {
  computeCardStats,
  computeDeathStats,
  computeOverviewStats,
  computeRelicStats,
  computeRemovedCardStats,
  computeShopStats,
  filterRuns,
} from "@/lib/analytics";

type AggregateInsightsProps = {
  runs: Run[];
  selectedCharacter?: string;
  onSelectedCharacterChange?: (character: string | undefined) => void;
};

export function AggregateInsights({
  runs,
  selectedCharacter,
  onSelectedCharacterChange,
}: AggregateInsightsProps) {
  const MIN_ROWS = 20;
  const [filters, setFilters] = useState<RunFilters>({});

  const characters = useMemo(
    () => Array.from(new Set(runs.map((r) => r.character))).sort(),
    [runs],
  );

  const ascensions = useMemo(
    () =>
      Array.from(new Set(runs.map((r) => r.ascensionLevel)))
        .sort((a, b) => a - b),
    [runs],
  );

  const filteredRuns = useMemo(() => {
    const effectiveFilters: RunFilters = {
      ...filters,
      character: selectedCharacter ?? characters[0],
    };
    return filterRuns(runs, effectiveFilters);
  }, [runs, filters, selectedCharacter, characters]);

  const overview = useMemo(
    () => computeOverviewStats(filteredRuns),
    [filteredRuns],
  );
  const deathStats = useMemo(
    () => computeDeathStats(filteredRuns),
    [filteredRuns],
  );
  const cardStats = useMemo(
    () => computeCardStats(filteredRuns),
    [filteredRuns],
  );
  const relicStats = useMemo(
    () => computeRelicStats(filteredRuns),
    [filteredRuns],
  );
  const shopStats = useMemo(
    () => computeShopStats(filteredRuns),
    [filteredRuns],
  );
  const removedCardStats = useMemo(
    () => computeRemovedCardStats(filteredRuns),
    [filteredRuns],
  );

  const sortedCards = useMemo(() => {
    const entries = Object.entries(cardStats);
    entries.sort(([, a], [, b]) => b.offered - a.offered);
    return entries;
  }, [cardStats]);

  const sortedDeaths = useMemo(() => {
    const entries = Object.entries(deathStats.deathCounts);
    entries.sort(([, a], [, b]) => b - a);
    return entries;
  }, [deathStats]);

  const sortedRelics = useMemo(() => {
    const entries = Object.entries(relicStats);
    entries.sort(([, a], [, b]) => b.runsWithRelic - a.runsWithRelic);
    return entries;
  }, [relicStats]);

  const sortedRemovedCards = useMemo(() => {
    const entries = Object.entries(removedCardStats);
    entries.sort(([, a], [, b]) => b.timesRemoved - a.timesRemoved);
    return entries;
  }, [removedCardStats]);

  const sortedShopCards = useMemo(() => {
    const entries = Object.entries(shopStats.cards);
    entries.sort(([, a], [, b]) => b.bought - a.bought);
    return entries;
  }, [shopStats.cards]);

  const sortedShopRelics = useMemo(() => {
    const entries = Object.entries(shopStats.relics);
    entries.sort(([, a], [, b]) => b.bought - a.bought);
    return entries;
  }, [shopStats.relics]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Aggregate Insights
          </h1>
          <p className="text-xs text-zinc-500">
            Based on {filteredRuns.length} runs for{" "}
            {selectedCharacter ?? "all characters"}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-semibold text-zinc-600">
              Character
            </label>
            <select
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs"
              value={selectedCharacter ?? ""}
              onChange={(event) =>
                onSelectedCharacterChange?.(
                  event.target.value || undefined,
                )
              }
            >
              {characters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-semibold text-zinc-600">
              Ascension
            </label>
            <select
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs"
              value={
                typeof filters.ascension === "number"
                  ? String(filters.ascension)
                  : ""
              }
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  ascension:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                }))
              }
            >
              <option value="">All</option>
              {ascensions.map((level) => (
                <option key={level} value={level}>
                  A{level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-semibold text-zinc-600">
              Result
            </label>
            <select
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs"
              value={filters.result ?? ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  result:
                    event.target.value === ""
                      ? undefined
                      : (event.target.value as RunFilters["result"]),
                }))
              }
            >
              <option value="">All</option>
              <option value="win">Wins only</option>
              <option value="loss">Losses only</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Total Runs
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {overview.totalRuns}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Win Rate
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {(overview.winRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Avg Floor
          </div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {overview.avgFloor.toFixed(1)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Most Common Death
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-900">
            {overview.mostCommonDeath ?? "—"}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Card Pick Rates
          </h2>
          <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Card</th>
                  <th className="px-3 py-2 text-right">Offered</th>
                  <th className="px-3 py-2 text-right">Picked</th>
                  <th className="px-3 py-2 text-right">Pick %</th>
                  <th className="px-3 py-2 text-right">Win %</th>
                  <th className="px-3 py-2 text-right">Skip %</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({
                  length: Math.max(sortedCards.length, MIN_ROWS),
                }).map((_, index) => {
                  const entry = sortedCards[index];
                  if (!entry) {
                    return (
                      <tr
                        key={`card-empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5">&nbsp;</td>
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                      </tr>
                    );
                  }
                  const [name, stat] = entry;
                  const rate =
                    stat.offered > 0 ? (stat.picked / stat.offered) * 100 : 0;
                  const winRate =
                    stat.runsWithCard > 0
                      ? (stat.winsWithCard / stat.runsWithCard) * 100
                      : 0;
                  const skipRate =
                    stat.offered > 0
                      ? (stat.skipOffers / stat.offered) * 100
                      : 0;
                  return (
                    <tr
                      key={name}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-800">
                        {name}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.offered}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.picked}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {rate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {winRate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {skipRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {sortedCards.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-3 text-center text-zinc-500"
                    >
                      No card choices found for the selected runs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Death Breakdown
            </h2>
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Enemy</th>
                    <th className="px-3 py-2 text-right">Deaths</th>
                  </tr>
                </thead>
                <tbody>
                {Array.from({
                  length: Math.max(sortedDeaths.length, MIN_ROWS),
                }).map((_, index) => {
                  const entry = sortedDeaths[index];
                  if (!entry) {
                    return (
                      <tr
                        key={`death-empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5">&nbsp;</td>
                        <td className="px-3 py-1.5" />
                      </tr>
                    );
                  }
                  const [enemy, count] = entry;
                  return (
                    <tr
                      key={enemy}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-800">
                        {enemy}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {count}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Relic Performance
            </h2>
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Relic</th>
                    <th className="px-3 py-2 text-right">Runs</th>
                    <th className="px-3 py-2 text-right">Win %</th>
                    <th className="px-3 py-2 text-right">Avg Floor</th>
                  </tr>
                </thead>
                <tbody>
                {Array.from({
                  length: Math.max(sortedRelics.length, MIN_ROWS),
                }).map((_, index) => {
                  const entry = sortedRelics[index];
                  if (!entry) {
                    return (
                      <tr
                        key={`relic-empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5">&nbsp;</td>
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                      </tr>
                    );
                  }
                  const [name, stat] = entry;
                  const winRate =
                    stat.runsWithRelic > 0
                      ? (stat.winCount / stat.runsWithRelic) * 100
                      : 0;
                  return (
                    <tr
                      key={name}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-800">
                        {name}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.runsWithRelic}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {winRate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.avgFloor.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Removed Cards
          </h2>
          <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Card</th>
                  <th className="px-3 py-2 text-right">Removed</th>
                  <th className="px-3 py-2 text-right">Runs</th>
                  <th className="px-3 py-2 text-right">Win %</th>
                  <th className="px-3 py-2 text-right">Avg Floor</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({
                  length: Math.max(sortedRemovedCards.length, MIN_ROWS),
                }).map((_, index) => {
                  const entry = sortedRemovedCards[index];
                  if (!entry) {
                    return (
                      <tr
                        key={`removed-empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5">&nbsp;</td>
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                      </tr>
                    );
                  }
                  const [name, stat] = entry;
                  const winRate =
                    stat.runsWithRemoval > 0
                      ? (stat.winsWithRemoval / stat.runsWithRemoval) * 100
                      : 0;
                  return (
                    <tr
                      key={name}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-800">
                        {name}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.timesRemoved}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.runsWithRemoval}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {winRate.toFixed(1)}%
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.avgFloor.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Shop – Cards
            </h2>
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Card</th>
                    <th className="px-3 py-2 text-right">Bought</th>
                    <th className="px-3 py-2 text-right">Runs</th>
                    <th className="px-3 py-2 text-right">Win %</th>
                  </tr>
                </thead>
                <tbody>
                {Array.from({
                  length: Math.max(sortedShopCards.length, MIN_ROWS),
                }).map((_, index) => {
                  const entry = sortedShopCards[index];
                  if (!entry) {
                    return (
                      <tr
                        key={`shop-card-empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5">&nbsp;</td>
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                      </tr>
                    );
                  }
                  const [name, stat] = entry;
                  const winRate =
                    stat.runsWithPurchase > 0
                      ? (stat.winsWithPurchase / stat.runsWithPurchase) * 100
                      : 0;
                  return (
                    <tr
                      key={name}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-800">
                        {name}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.bought}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.runsWithPurchase}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {winRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Shop – Relics
            </h2>
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Relic</th>
                    <th className="px-3 py-2 text-right">Bought</th>
                    <th className="px-3 py-2 text-right">Runs</th>
                    <th className="px-3 py-2 text-right">Win %</th>
                  </tr>
                </thead>
                <tbody>
                {Array.from({
                  length: Math.max(sortedShopRelics.length, MIN_ROWS),
                }).map((_, index) => {
                  const entry = sortedShopRelics[index];
                  if (!entry) {
                    return (
                      <tr
                        key={`shop-relic-empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5">&nbsp;</td>
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5" />
                      </tr>
                    );
                  }
                  const [name, stat] = entry;
                  const winRate =
                    stat.runsWithPurchase > 0
                      ? (stat.winsWithPurchase / stat.runsWithPurchase) * 100
                      : 0;
                  return (
                    <tr
                      key={name}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left font-medium text-zinc-800">
                        {name}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.bought}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {stat.runsWithPurchase}
                      </td>
                      <td className="px-3 py-1.5 text-right text-zinc-700">
                        {winRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

