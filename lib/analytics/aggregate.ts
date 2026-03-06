import type {
  CardOccurrenceStats,
  CardStats,
  DeathStats,
  DeckSizeStats,
  EncounterAverages,
  OverviewStats,
  RelicStats,
  RemovedCardStats,
  Run,
  RunFilters,
  ShopItemStats,
  ShopStats,
} from "@/types/run";
import {
  getCardChoicesRaw,
  getCampfireChoicesRaw,
  getItemsPurgedRaw,
  getMasterDeckRaw,
  getPathPerFloorRaw,
  getRelicsRaw,
  getRaw,
  normalizeCardName,
} from "./helpers";

export function filterRuns(runs: Run[], filters: RunFilters): Run[] {
  return runs.filter((run) => {
    // Daily runs are excluded from aggregate stats unless explicitly opted in.
    if (!filters.includeDailies && run.isDaily) {
      return false;
    }
    if (filters.character && run.character !== filters.character) {
      return false;
    }
    if (
      typeof filters.ascension === "number" &&
      run.ascensionLevel !== filters.ascension
    ) {
      return false;
    }
    if (filters.result === "win" && !run.victory) {
      return false;
    }
    if (filters.result === "loss" && run.victory) {
      return false;
    }
    return true;
  });
}

export function computeOverviewStats(runs: Run[]): OverviewStats {
  const totalRuns = runs.length;
  if (totalRuns === 0) {
    return {
      totalRuns: 0,
      winRate: 0,
      avgFloor: 0,
      mostCommonDeath: undefined,
    };
  }

  let wins = 0;
  let floorSum = 0;
  const deathCounts: Record<string, number> = {};

  for (const run of runs) {
    if (run.victory) {
      wins += 1;
    }
    floorSum += run.floorReached;
    if (!run.victory && run.killedBy) {
      deathCounts[run.killedBy] = (deathCounts[run.killedBy] ?? 0) + 1;
    }
  }

  let mostCommonDeath: string | undefined;
  let maxDeaths = 0;
  for (const [enemy, count] of Object.entries(deathCounts)) {
    if (count > maxDeaths) {
      maxDeaths = count;
      mostCommonDeath = enemy;
    }
  }

  return {
    totalRuns,
    winRate: totalRuns > 0 ? wins / totalRuns : 0,
    avgFloor: totalRuns > 0 ? floorSum / totalRuns : 0,
    mostCommonDeath,
  };
}

export function computeDeathStats(runs: Run[]): DeathStats {
  const totalRuns = runs.length;
  if (totalRuns === 0) {
    return {
      deathCounts: {},
      averageFloor: 0,
      winRate: 0,
      mostCommonKilledBy: undefined,
    };
  }

  const deathCounts: Record<string, number> = {};
  let wins = 0;
  let floorSum = 0;

  for (const run of runs) {
    if (run.victory) {
      wins += 1;
    } else if (run.killedBy) {
      deathCounts[run.killedBy] = (deathCounts[run.killedBy] ?? 0) + 1;
    }
    floorSum += run.floorReached;
  }

  let mostCommonKilledBy: string | undefined;
  let maxDeaths = 0;
  for (const [enemy, count] of Object.entries(deathCounts)) {
    if (count > maxDeaths) {
      maxDeaths = count;
      mostCommonKilledBy = enemy;
    }
  }

  return {
    deathCounts,
    averageFloor: totalRuns > 0 ? floorSum / totalRuns : 0,
    winRate: totalRuns > 0 ? wins / totalRuns : 0,
    mostCommonKilledBy,
  };
}

export function computeCardStats(runs: Run[]): Record<string, CardStats> {
  const stats: Record<string, CardStats> = {};

  const ensureCard = (id: string): CardStats => {
    if (!stats[id]) {
      stats[id] = {
        offered: 0,
        picked: 0,
        skipOffers: 0,
        runsWithCard: 0,
        winsWithCard: 0,
      };
    }
    return stats[id];
  };

  for (const run of runs) {
    // Track presence of cards in the final deck for runsWithCard / winsWithCard.
    const masterDeck = getMasterDeckRaw(run);
    if (masterDeck.length > 0) {
      const seenInDeck = new Set<string>();
      for (const entry of masterDeck) {
        const id = normalizeCardName(entry);
        seenInDeck.add(id);
      }
      for (const id of seenInDeck) {
        const stat = ensureCard(id);
        stat.runsWithCard += 1;
        if (run.victory) {
          stat.winsWithCard += 1;
        }
      }
    }

    const cardChoices = getCardChoicesRaw(run);
    if (cardChoices.length === 0) continue;

    for (const choice of cardChoices) {
      const notPickedRaw = choice.not_picked ?? choice.not_picked_cards ?? [];
      const pickedRaw = choice.picked ?? choice.picked_card ?? null;

      const notPicked: string[] = Array.isArray(notPickedRaw)
        ? notPickedRaw.filter((c: unknown): c is string => typeof c === "string")
        : [];

      if (pickedRaw === "SKIP") {
        // Player skipped the reward entirely; count skipOffers for each offered card.
        for (const cardName of notPicked) {
          const id = normalizeCardName(cardName);
          const stat = ensureCard(id);
          stat.offered += 1;
          stat.skipOffers += 1;
        }
        continue;
      }

      if (typeof pickedRaw === "string") {
        const pickedId = normalizeCardName(pickedRaw);
        const pickedStat = ensureCard(pickedId);
        pickedStat.offered += 1;
        pickedStat.picked += 1;

        for (const cardName of notPicked) {
          const id = normalizeCardName(cardName);
          const stat = ensureCard(id);
          stat.offered += 1;
        }
      } else {
        // No picked card recorded; treat as offers-only without skip semantics.
        for (const cardName of notPicked) {
          const id = normalizeCardName(cardName);
          const stat = ensureCard(id);
          stat.offered += 1;
        }
      }
    }
  }

  return stats;
}

export function computeCardOccurrenceStats(
  runs: Run[],
): CardOccurrenceStats[] {
  const map = new Map<string, { overall: number; wins: number; losses: number }>();

  for (const run of runs) {
    const masterDeck = getMasterDeckRaw(run);
    if (masterDeck.length === 0) continue;

    const seen = new Set<string>();
    for (const entry of masterDeck) {
      const id = normalizeCardName(entry);
      seen.add(id);
    }

    for (const id of seen) {
      const record = map.get(id) ?? { overall: 0, wins: 0, losses: 0 };
      record.overall += 1;
      if (run.victory) {
        record.wins += 1;
      } else {
        record.losses += 1;
      }
      map.set(id, record);
    }
  }

  const result: CardOccurrenceStats[] = [];
  for (const [id, record] of map.entries()) {
    result.push({
      id,
      runsWithCardOverall: record.overall,
      runsWithCardWins: record.wins,
      runsWithCardLosses: record.losses,
    });
  }

  result.sort((a, b) => {
    if (b.runsWithCardOverall !== a.runsWithCardOverall) {
      return b.runsWithCardOverall - a.runsWithCardOverall;
    }
    return a.id.localeCompare(b.id);
  });

  return result;
}

export function computeRelicStats(runs: Run[]): Record<string, RelicStats> {
  const relicTotals: Record<
    string,
    { runsWithRelic: number; winCount: number; floorSum: number }
  > = {};

  for (const run of runs) {
    const relics = getRelicsRaw(run);
    if (relics.length === 0) continue;

    const seenThisRun = new Set<string>();
    for (const relic of relics) {
      if (typeof relic !== "string") continue;
      if (seenThisRun.has(relic)) continue;
      seenThisRun.add(relic);

      if (!relicTotals[relic]) {
        relicTotals[relic] = { runsWithRelic: 0, winCount: 0, floorSum: 0 };
      }

      relicTotals[relic].runsWithRelic += 1;
      relicTotals[relic].floorSum += run.floorReached;
      if (run.victory) {
        relicTotals[relic].winCount += 1;
      }
    }
  }

  const result: Record<string, RelicStats> = {};
  for (const [name, data] of Object.entries(relicTotals)) {
    result[name] = {
      runsWithRelic: data.runsWithRelic,
      winCount: data.winCount,
      avgFloor:
        data.runsWithRelic > 0 ? data.floorSum / data.runsWithRelic : 0,
    };
  }

  return result;
}

export function computeShopStats(runs: Run[]): ShopStats {
  const cardStats: Record<string, ShopItemStats> = {};
  const relicStats: Record<string, ShopItemStats> = {};

  const ensureItem = (
    map: Record<string, ShopItemStats>,
    key: string,
  ): ShopItemStats => {
    if (!map[key]) {
      map[key] = { bought: 0, runsWithPurchase: 0, winsWithPurchase: 0 };
    }
    return map[key];
  };

  for (const run of runs) {
    const raw = getRaw(run);
    const itemsPurchased: unknown = raw?.items_purchased;
    if (!Array.isArray(itemsPurchased)) continue;

    const masterDeck: unknown = raw?.master_deck;
    const deckIds = new Set<string>();
    if (Array.isArray(masterDeck)) {
      for (const entry of masterDeck) {
        if (typeof entry !== "string") continue;
        deckIds.add(normalizeCardName(entry));
      }
    }

    const relics: unknown = raw?.relics;
    const relicSet = new Set<string>();
    if (Array.isArray(relics)) {
      for (const relic of relics) {
        if (typeof relic !== "string") continue;
        relicSet.add(relic);
      }
    }

    const seenCardThisRun = new Set<string>();
    const seenRelicThisRun = new Set<string>();

    for (const item of itemsPurchased) {
      if (typeof item !== "string") continue;

      const cardId = normalizeCardName(item);
      const isCard = deckIds.has(cardId);
      const isRelic = relicSet.has(item);

      if (isCard) {
        const stat = ensureItem(cardStats, cardId);
        stat.bought += 1;
        if (!seenCardThisRun.has(cardId)) {
          seenCardThisRun.add(cardId);
          stat.runsWithPurchase += 1;
          if (run.victory) {
            stat.winsWithPurchase += 1;
          }
        }
      } else if (isRelic) {
        const stat = ensureItem(relicStats, item);
        stat.bought += 1;
        if (!seenRelicThisRun.has(item)) {
          seenRelicThisRun.add(item);
          stat.runsWithPurchase += 1;
          if (run.victory) {
            stat.winsWithPurchase += 1;
          }
        }
      }
      // Items that are neither in the final deck nor relic list are skipped
      // (likely potions or events we don't currently track).
    }
  }

  return { cards: cardStats, relics: relicStats };
}

export function computeRemovedCardStats(
  runs: Run[],
): Record<string, RemovedCardStats> {
  const stats: Record<
    string,
    { timesRemoved: number; runsWithRemoval: number; winsWithRemoval: number }
  > = {};

  for (const run of runs) {
    const removed = getItemsPurgedRaw(run);
    if (removed.length === 0) continue;

    const seenThisRun = new Set<string>();
    for (const entry of removed) {
      const id = normalizeCardName(entry);

      if (!stats[id]) {
        stats[id] = {
          timesRemoved: 0,
          runsWithRemoval: 0,
          winsWithRemoval: 0,
        };
      }

      const record = stats[id];
      record.timesRemoved += 1;

      if (!seenThisRun.has(id)) {
        seenThisRun.add(id);
        record.runsWithRemoval += 1;
        if (run.victory) {
          record.winsWithRemoval += 1;
        }
      }
    }
  }

  const result: Record<string, RemovedCardStats> = {};
  for (const [id, data] of Object.entries(stats)) {
    result[id] = {
      timesRemoved: data.timesRemoved,
      runsWithRemoval: data.runsWithRemoval,
      winsWithRemoval: data.winsWithRemoval,
    };
  }

  return result;
}

export function computeDeckSizeStats(runs: Run[]): DeckSizeStats {
  if (runs.length === 0) {
    return {
      avgDeckSizeAll: 0,
      avgDeckSizeWins: 0,
      avgDeckSizeLosses: 0,
    };
  }

  let totalAll = 0;
  let countAll = 0;
  let totalWins = 0;
  let countWins = 0;
  let totalLosses = 0;
  let countLosses = 0;

  for (const run of runs) {
    const masterDeck = getMasterDeckRaw(run);
    if (masterDeck.length === 0) continue;
    const size = masterDeck.length;

    totalAll += size;
    countAll += 1;

    if (run.victory) {
      totalWins += size;
      countWins += 1;
    } else {
      totalLosses += size;
      countLosses += 1;
    }
  }

  return {
    avgDeckSizeAll: countAll > 0 ? totalAll / countAll : 0,
    avgDeckSizeWins: countWins > 0 ? totalWins / countWins : 0,
    avgDeckSizeLosses: countLosses > 0 ? totalLosses / countLosses : 0,
  };
}

export function computeEncounterAverages(runs: Run[]): EncounterAverages {
  const makeBucket = () => ({ wins: 0, losses: 0 });

  const totals = {
    monsters: makeBucket(),
    elites: makeBucket(),
    shops: makeBucket(),
    events: makeBucket(),
    rests: makeBucket(),
    restSiteUpgrades: makeBucket(),
    cardRemovals: makeBucket(),
  };

  let winRuns = 0;
  let lossRuns = 0;

  for (const run of runs) {
    const pathPerFloor = getPathPerFloorRaw(run);
    const campfireChoices = getCampfireChoicesRaw(run);
    const itemsPurged = getItemsPurgedRaw(run);

    let monsters = 0;
    let elites = 0;
    let shops = 0;
    let events = 0;
    let restSites = 0;
    let smiths = 0;
    let removals = 0;

    if (pathPerFloor.length > 0) {
      for (const value of pathPerFloor) {
        if (value === "M") monsters += 1;
        else if (value === "E") elites += 1;
        else if (value === "$") shops += 1;
        else if (value === "?") events += 1;
        else if (value === "R") restSites += 1;
      }
    }

    if (campfireChoices.length > 0) {
      for (const choice of campfireChoices) {
        if (typeof choice !== "object" || choice === null) continue;
        const key = (choice as any).key;
        if (key === "SMITH") {
          smiths += 1;
        }
      }
    }

    removals += itemsPurged.length;

    const bucket =
      run.victory
        ? (() => {
            winRuns += 1;
            return "wins";
          })()
        : (() => {
            lossRuns += 1;
            return "losses";
          })();

    (totals.monsters as any)[bucket] += monsters;
    (totals.elites as any)[bucket] += elites;
    (totals.shops as any)[bucket] += shops;
    (totals.events as any)[bucket] += events;
    (totals.rests as any)[bucket] += restSites;
    (totals.restSiteUpgrades as any)[bucket] += smiths;
    (totals.cardRemovals as any)[bucket] += removals;
  }

  const safeDiv = (value: number, runsCount: number) =>
    runsCount > 0 ? value / runsCount : 0;

  return {
    monsters: {
      wins: safeDiv(totals.monsters.wins, winRuns),
      losses: safeDiv(totals.monsters.losses, lossRuns),
    },
    elites: {
      wins: safeDiv(totals.elites.wins, winRuns),
      losses: safeDiv(totals.elites.losses, lossRuns),
    },
    shops: {
      wins: safeDiv(totals.shops.wins, winRuns),
      losses: safeDiv(totals.shops.losses, lossRuns),
    },
    events: {
      wins: safeDiv(totals.events.wins, winRuns),
      losses: safeDiv(totals.events.losses, lossRuns),
    },
    rests: {
      wins: safeDiv(totals.rests.wins, winRuns),
      losses: safeDiv(totals.rests.losses, lossRuns),
    },
    restSiteUpgrades: {
      wins: safeDiv(totals.restSiteUpgrades.wins, winRuns),
      losses: safeDiv(totals.restSiteUpgrades.losses, lossRuns),
    },
    cardRemovals: {
      wins: safeDiv(totals.cardRemovals.wins, winRuns),
      losses: safeDiv(totals.cardRemovals.losses, lossRuns),
    },
  };
}
