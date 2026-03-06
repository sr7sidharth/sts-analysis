"use client";

import { useMemo, useState } from "react";
import type { GameId, Run } from "@/types/run";
import { getPotionsUsed } from "@/lib/analytics";
import { getAnalyticsStrategyForGame } from "@/lib/analytics/strategies";
import type { SortState } from "@/lib/sortUtils";
import { toggleSort, sortIndicator } from "@/lib/sortUtils";
import { useRunFilters } from "@/lib/useRunFilters";
import { ScrollableTable } from "@/components/ScrollableTable";
import type { ColumnDef } from "@/components/ScrollableTable";
import { formatIdLabel } from "@/lib/labels";

type AggregateInsightsProps = {
  runs: Run[];
  onSelectedCharacterChange?: (character: string | undefined) => void;
};


export function AggregateInsights({
  runs,
  onSelectedCharacterChange,
}: AggregateInsightsProps) {
  const {
    filters,
    setCharacter,
    setAscension,
    setResult,
    setIncludeDailies,
    filteredRuns,
    characters,
    ascensions,
    hasDailyRuns,
  } = useRunFilters(runs);

  const game: GameId =
    (filteredRuns[0]?.game ?? runs[0]?.game ?? "STS1") as GameId;
  const strategy = useMemo(
    () => getAnalyticsStrategyForGame(game),
    [game],
  );

  const overview = useMemo(
    () => strategy.computeOverviewStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const deckSizeStats = useMemo(
    () => strategy.computeDeckSizeStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const relicSizeStats = useMemo(
    () => strategy.computeRelicSizeStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const deathStats = useMemo(
    () => strategy.computeDeathStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const cardStats = useMemo(
    () => strategy.computeCardStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const cardOccurrenceStats = useMemo(
    () => strategy.computeCardOccurrenceStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const relicStats = useMemo(
    () => strategy.computeRelicStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const shopStats = useMemo(
    () => strategy.computeShopStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const removedCardStats = useMemo(
    () => strategy.computeRemovedCardStats(filteredRuns),
    [strategy, filteredRuns],
  );
  const encounterAverages = useMemo(
    () => strategy.computeEncounterAverages(filteredRuns),
    [strategy, filteredRuns],
  );

  const potionsUsedStats = useMemo(() => {
    let totalAll = 0;
    let countAll = 0;
    let totalWins = 0;
    let countWins = 0;
    let totalLosses = 0;
    let countLosses = 0;
    for (const run of filteredRuns) {
      const v = getPotionsUsed(run, 0);
      if (v == null) continue;
      totalAll += v;
      countAll += 1;
      if (run.victory) {
        totalWins += v;
        countWins += 1;
      } else {
        totalLosses += v;
        countLosses += 1;
      }
    }
    if (countAll === 0) return null;
    return {
      avgAll: totalAll / countAll,
      avgWins: countWins > 0 ? totalWins / countWins : 0,
      avgLosses: countLosses > 0 ? totalLosses / countLosses : 0,
    };
  }, [filteredRuns]);

  // ── Card pick rate sort ──────────────────────────────────────────────────
  type CardPickCol = "name" | "offered" | "picked" | "pickRate" | "winRate" | "skipRate";
  const [cardPickSort, setCardPickSort] = useState<SortState<CardPickCol>>({
    column: "offered",
    direction: "desc",
  });

  const sortedCards = useMemo(() => {
    const entries = Object.entries(cardStats).map(([name, stat]) => {
      const pickRate = stat.offered > 0 ? (stat.picked / stat.offered) * 100 : 0;
      const winRate = stat.runsWithCard > 0 ? (stat.winsWithCard / stat.runsWithCard) * 100 : 0;
      const skipRate = stat.offered > 0 ? (stat.skipOffers / stat.offered) * 100 : 0;
      return { name, stat, pickRate, winRate, skipRate };
    });
    const dir = cardPickSort.direction === "asc" ? 1 : -1;
    entries.sort((a, b) => {
      switch (cardPickSort.column) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "offered": return (a.stat.offered - b.stat.offered) * dir;
        case "picked": return (a.stat.picked - b.stat.picked) * dir;
        case "pickRate": return (a.pickRate - b.pickRate) * dir;
        case "winRate": return (a.winRate - b.winRate) * dir;
        case "skipRate": return (a.skipRate - b.skipRate) * dir;
      }
    });
    return entries;
  }, [cardStats, cardPickSort]);

  // ── Card occurrence sort ─────────────────────────────────────────────────
  type CardOccCol = "name" | "overall" | "wins" | "losses";
  const [cardOccSort, setCardOccSort] = useState<SortState<CardOccCol>>({
    column: "overall",
    direction: "desc",
  });

  const sortedCardOccurrence = useMemo(() => {
    const entries = [...cardOccurrenceStats];
    const dir = cardOccSort.direction === "asc" ? 1 : -1;
    entries.sort((a, b) => {
      switch (cardOccSort.column) {
        case "name": return a.id.localeCompare(b.id) * dir;
        case "overall": return (a.runsWithCardOverall - b.runsWithCardOverall) * dir || a.id.localeCompare(b.id);
        case "wins": return (a.runsWithCardWins - b.runsWithCardWins) * dir || a.id.localeCompare(b.id);
        case "losses": return (a.runsWithCardLosses - b.runsWithCardLosses) * dir || a.id.localeCompare(b.id);
      }
    });
    return entries;
  }, [cardOccurrenceStats, cardOccSort]);

  // ── Relic occurrence sort ────────────────────────────────────────────────
  type RelicCol = "name" | "overall" | "wins" | "losses";
  const [relicSort, setRelicSort] = useState<SortState<RelicCol>>({
    column: "overall",
    direction: "desc",
  });

  const sortedRelics = useMemo(() => {
    const entries = Object.entries(relicStats).map(([name, stat]) => ({
      name,
      stat,
      losses: stat.runsWithRelic - stat.winCount,
    }));
    const dir = relicSort.direction === "asc" ? 1 : -1;
    entries.sort((a, b) => {
      switch (relicSort.column) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "overall": return (a.stat.runsWithRelic - b.stat.runsWithRelic) * dir || a.name.localeCompare(b.name);
        case "wins": return (a.stat.winCount - b.stat.winCount) * dir || a.name.localeCompare(b.name);
        case "losses": return (a.losses - b.losses) * dir || a.name.localeCompare(b.name);
      }
    });
    return entries;
  }, [relicStats, relicSort]);

  // ── Other sorted lists ───────────────────────────────────────────────────
  const sortedDeaths = useMemo(() => {
    return Object.entries(deathStats.deathCounts).sort(([, a], [, b]) => b - a);
  }, [deathStats]);

  const sortedRemovedCards = useMemo(() => {
    return Object.entries(removedCardStats).sort(
      ([, a], [, b]) => b.timesRemoved - a.timesRemoved,
    );
  }, [removedCardStats]);

  const sortedShopCards = useMemo(() => {
    return Object.entries(shopStats.cards).sort(
      ([, a], [, b]) => b.bought - a.bought,
    );
  }, [shopStats.cards]);

  const sortedShopRelics = useMemo(() => {
    return Object.entries(shopStats.relics).sort(
      ([, a], [, b]) => b.bought - a.bought,
    );
  }, [shopStats.relics]);

  // ── Column definitions ───────────────────────────────────────────────────
  const cardPickCols: ColumnDef[] = [
    { label: "Card", onClick: () => setCardPickSort(p => toggleSort(p, "name")), sortIndicator: sortIndicator(cardPickSort, "name") },
    { label: "Offered", align: "right", onClick: () => setCardPickSort(p => toggleSort(p, "offered")), sortIndicator: sortIndicator(cardPickSort, "offered") },
    { label: "Picked", align: "right", onClick: () => setCardPickSort(p => toggleSort(p, "picked")), sortIndicator: sortIndicator(cardPickSort, "picked") },
    { label: "Pick %", align: "right", onClick: () => setCardPickSort(p => toggleSort(p, "pickRate")), sortIndicator: sortIndicator(cardPickSort, "pickRate") },
    { label: "Win %", align: "right", onClick: () => setCardPickSort(p => toggleSort(p, "winRate")), sortIndicator: sortIndicator(cardPickSort, "winRate") },
    { label: "Skip %", align: "right", onClick: () => setCardPickSort(p => toggleSort(p, "skipRate")), sortIndicator: sortIndicator(cardPickSort, "skipRate") },
  ];

  const cardOccCols: ColumnDef[] = [
    { label: "Rank" },
    { label: "Card Name", onClick: () => setCardOccSort(p => toggleSort(p, "name")), sortIndicator: sortIndicator(cardOccSort, "name") },
    { label: "Overall Occurrence", align: "right", onClick: () => setCardOccSort(p => toggleSort(p, "overall")), sortIndicator: sortIndicator(cardOccSort, "overall") },
    { label: "Winning Occurrence", align: "right", onClick: () => setCardOccSort(p => toggleSort(p, "wins")), sortIndicator: sortIndicator(cardOccSort, "wins") },
    { label: "Losing Occurrence", align: "right", onClick: () => setCardOccSort(p => toggleSort(p, "losses")), sortIndicator: sortIndicator(cardOccSort, "losses") },
  ];

  const relicOccCols: ColumnDef[] = [
    { label: "Rank" },
    { label: "Relic Name", onClick: () => setRelicSort(p => toggleSort(p, "name")), sortIndicator: sortIndicator(relicSort, "name") },
    { label: "Overall Occurrence", align: "right", onClick: () => setRelicSort(p => toggleSort(p, "overall")), sortIndicator: sortIndicator(relicSort, "overall") },
    { label: "Winning Occurrence", align: "right", onClick: () => setRelicSort(p => toggleSort(p, "wins")), sortIndicator: sortIndicator(relicSort, "wins") },
    { label: "Losing Occurrence", align: "right", onClick: () => setRelicSort(p => toggleSort(p, "losses")), sortIndicator: sortIndicator(relicSort, "losses") },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Aggregate Insights
          </h1>
          <p className="text-xs text-zinc-500">
            Based on {filteredRuns.length} runs for{" "}
            {filters.character ?? "all characters"}.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-semibold text-zinc-600">
              Character
            </label>
            <select
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-900"
              value={filters.character ?? ""}
              onChange={(e) => {
                const val = e.target.value || undefined;
                setCharacter(val);
                onSelectedCharacterChange?.(val);
              }}
            >
              <option value="">All</option>
              {characters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-semibold text-zinc-600">
              Ascension
            </label>
            <select
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-900"
              value={typeof filters.ascension === "number" ? String(filters.ascension) : ""}
              onChange={(e) =>
                setAscension(e.target.value === "" ? undefined : Number(e.target.value))
              }
            >
              <option value="">All</option>
              {ascensions.map((level) => (
                <option key={level} value={level}>A{level}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] font-semibold text-zinc-600">
              Result
            </label>
            <select
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-900"
              value={filters.result ?? ""}
              onChange={(e) =>
                setResult(e.target.value === "" ? undefined : (e.target.value as "win" | "loss"))
              }
            >
              <option value="">All</option>
              <option value="win">Wins only</option>
              <option value="loss">Losses only</option>
            </select>
          </div>

          {hasDailyRuns && (
            <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100">
              <input
                type="checkbox"
                className="accent-amber-500"
                checked={!!filters.includeDailies}
                onChange={(e) => setIncludeDailies(e.target.checked)}
              />
              Include Daily runs
            </label>
          )}
        </div>
      </section>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Total Runs</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{overview.totalRuns}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Win Rate</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{(overview.winRate * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Avg Floor</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{overview.avgFloor.toFixed(1)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Most Common Death</div>
          <div className="mt-1 text-sm font-medium text-zinc-900">{formatIdLabel(overview.mostCommonDeath ?? "") || "—"}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 md:col-span-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Deck Size (Final Deck)</div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-zinc-800 md:text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – All</div>
              <div className="mt-0.5 font-semibold">{deckSizeStats.avgDeckSizeAll.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – Wins</div>
              <div className="mt-0.5 font-semibold">{deckSizeStats.avgDeckSizeWins.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – Losses</div>
              <div className="mt-0.5 font-semibold">{deckSizeStats.avgDeckSizeLosses.toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 md:col-span-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Relic Size</div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-zinc-800 md:text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – All</div>
              <div className="mt-0.5 font-semibold">{relicSizeStats.avgRelicSizeAll.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – Wins</div>
              <div className="mt-0.5 font-semibold">{relicSizeStats.avgRelicSizeWins.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – Losses</div>
              <div className="mt-0.5 font-semibold">{relicSizeStats.avgRelicSizeLosses.toFixed(1)}</div>
            </div>
          </div>
        </div>
        {potionsUsedStats != null && (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 md:col-span-4">
            <div
              className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
              title="This might be inaccurate if you generate potions within a combat"
            >
              Potions used
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-zinc-800 md:text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – All</div>
                <div className="mt-0.5 font-semibold">{potionsUsedStats.avgAll.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – Wins</div>
                <div className="mt-0.5 font-semibold">{potionsUsedStats.avgWins.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">Avg – Losses</div>
                <div className="mt-0.5 font-semibold">{potionsUsedStats.avgLosses.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── All tables — each is its own grid cell so heights don't equalise ── */}
      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Card Pick Rates</h2>
          <ScrollableTable
            columns={cardPickCols}
            emptyMessage="No card choices found for the selected runs."
            rows={sortedCards.map(({ name, stat, pickRate, winRate, skipRate }) => [
              <span className="font-medium text-zinc-800">
                {formatIdLabel(name)}
              </span>,
              <span className="text-zinc-700">{stat.offered}</span>,
              <span className="text-zinc-700">{stat.picked}</span>,
              <span className="text-zinc-700">{pickRate.toFixed(1)}%</span>,
              <span className="text-zinc-700">{winRate.toFixed(1)}%</span>,
              <span className="text-zinc-700">{skipRate.toFixed(1)}%</span>,
            ])}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Death Breakdown</h2>
          <ScrollableTable
            columns={[
              { label: "Enemy" },
              { label: "Deaths", align: "right" },
            ]}
            emptyMessage="No deaths recorded."
            rows={sortedDeaths.map(([enemy, count]) => [
              <span className="font-medium text-zinc-800">
                {formatIdLabel(enemy)}
              </span>,
              <span className="text-zinc-700">{count}</span>,
            ])}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Card Occurrence</h2>
          <ScrollableTable
            columns={cardOccCols}
            emptyMessage="No final deck data found for the selected runs."
            rows={sortedCardOccurrence.map((entry, index) => [
              <span className="text-zinc-700">{index + 1}</span>,
              <span className="font-medium text-zinc-800">
                {formatIdLabel(entry.id)}
              </span>,
              <span className="text-zinc-700">{entry.runsWithCardOverall}</span>,
              <span className="text-emerald-700">{entry.runsWithCardWins}</span>,
              <span className="text-red-700">{entry.runsWithCardLosses}</span>,
            ])}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900" title="Number of encounters in winning vs losing runs">
            Encounter Averages
          </h2>
          <ScrollableTable
            columns={[
              { label: "Type" },
              { label: "Avg (Wins)", align: "right" },
              { label: "Avg (Losses)", align: "right" },
            ]}
            rows={[
              ["Monsters", encounterAverages.monsters],
              ["Elites", encounterAverages.elites],
              ["Shops", encounterAverages.shops],
              ["Events", encounterAverages.events],
              ["Rests", encounterAverages.rests],
              ["Rest smiths", encounterAverages.restSiteUpgrades],
              ["Card removals", encounterAverages.cardRemovals],
            ].map(([label, values]) => [
              <span className="text-zinc-800">{label as string}</span>,
              <span className="text-emerald-700">{(values as any).wins.toFixed(2)}</span>,
              <span className="text-red-700">{(values as any).losses.toFixed(2)}</span>,
            ])}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Relic Occurrence</h2>
          <ScrollableTable
            columns={relicOccCols}
            emptyMessage="No relic data found for the selected runs."
            rows={sortedRelics.map(({ name, stat, losses }, index) => [
              <span className="text-zinc-700">{index + 1}</span>,
              <span className="font-medium text-zinc-800">
                {formatIdLabel(name)}
              </span>,
              <span className="text-zinc-700">{stat.runsWithRelic}</span>,
              <span className="text-emerald-700">{stat.winCount}</span>,
              <span className="text-red-700">{losses}</span>,
            ])}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Removed Cards</h2>
          <ScrollableTable
            columns={[
              { label: "Card" },
              { label: "Removed", align: "right" },
              { label: "Runs", align: "right" },
              { label: "Win %", align: "right" },
            ]}
            emptyMessage="No cards removed in the selected runs."
            rows={sortedRemovedCards.map(([name, stat]) => {
              const winRate = stat.runsWithRemoval > 0
                ? (stat.winsWithRemoval / stat.runsWithRemoval) * 100
                : 0;
              return [
                <span className="font-medium text-zinc-800">
                  {formatIdLabel(name)}
                </span>,
                <span className="text-zinc-700">{stat.timesRemoved}</span>,
                <span className="text-zinc-700">{stat.runsWithRemoval}</span>,
                <span className="text-zinc-700">{winRate.toFixed(1)}%</span>,
              ];
            })}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Shop – Cards</h2>
          <ScrollableTable
            columns={[
              { label: "Card" },
              { label: "Bought", align: "right" },
              { label: "Win %", align: "right" },
            ]}
            emptyMessage="No shop card purchases recorded."
            rows={sortedShopCards.map(([name, stat]) => {
              const winRate = stat.runsWithPurchase > 0
                ? (stat.winsWithPurchase / stat.runsWithPurchase) * 100
                : 0;
              return [
                <span className="font-medium text-zinc-800">
                  {formatIdLabel(name)}
                </span>,
                <span className="text-zinc-700">{stat.bought}</span>,
                <span className="text-zinc-700">{winRate.toFixed(1)}%</span>,
              ];
            })}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Shop – Relics</h2>
          <ScrollableTable
            columns={[
              { label: "Relic" },
              { label: "Bought", align: "right" },
              { label: "Win %", align: "right" },
            ]}
            emptyMessage="No shop relic purchases recorded."
            rows={sortedShopRelics.map(([name, stat]) => {
              const winRate = stat.runsWithPurchase > 0
                ? (stat.winsWithPurchase / stat.runsWithPurchase) * 100
                : 0;
              return [
                <span className="font-medium text-zinc-800">
                  {formatIdLabel(name)}
                </span>,
                <span className="text-zinc-700">{stat.bought}</span>,
                <span className="text-zinc-700">{winRate.toFixed(1)}%</span>,
              ];
            })}
          />
        </div>
      </section>
    </div>
  );
}

