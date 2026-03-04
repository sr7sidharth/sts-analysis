import type {
  CardStats,
  DeathStats,
  RelicStats,
  Run,
  RunFilters,
  OverviewStats,
  ShopCardStats,
  ShopRelicStats,
  RemovedCardStats,
} from "@/types/run";

function normalizeCardName(name: string): string {
  const plusIndex = name.indexOf("+");
  if (plusIndex === -1) return name;
  return name.slice(0, plusIndex);
}

export function filterRuns(runs: Run[], filters: RunFilters): Run[] {
  return runs.filter((run) => {
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
    const raw: any = run.raw;

    // Track presence of cards in the final deck for runsWithCard / winsWithCard.
    const masterDeck: unknown = raw?.master_deck;
    if (Array.isArray(masterDeck)) {
      const seenInDeck = new Set<string>();
      for (const entry of masterDeck) {
        if (typeof entry !== "string") continue;
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

    if (!raw || !Array.isArray(raw.card_choices)) continue;

    for (const choice of raw.card_choices as any[]) {
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

export function computeRelicStats(runs: Run[]): Record<string, RelicStats> {
  const relicTotals: Record<
    string,
    { runsWithRelic: number; winCount: number; floorSum: number }
  > = {};

  for (const run of runs) {
    const raw: any = run.raw;
    const relics: unknown = raw?.relics;
    if (!Array.isArray(relics)) continue;

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

export type ShopStats = {
  cards: Record<string, ShopCardStats>;
  relics: Record<string, ShopRelicStats>;
};

export function computeShopStats(runs: Run[]): ShopStats {
  const cardStats: Record<string, ShopCardStats> = {};
  const relicStats: Record<string, ShopRelicStats> = {};

  const ensureCard = (id: string): ShopCardStats => {
    if (!cardStats[id]) {
      cardStats[id] = {
        bought: 0,
        runsWithPurchase: 0,
        winsWithPurchase: 0,
      };
    }
    return cardStats[id];
  };

  const ensureRelic = (name: string): ShopRelicStats => {
    if (!relicStats[name]) {
      relicStats[name] = {
        bought: 0,
        runsWithPurchase: 0,
        winsWithPurchase: 0,
      };
    }
    return relicStats[name];
  };

  for (const run of runs) {
    const raw: any = run.raw;
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
        const stat = ensureCard(cardId);
        stat.bought += 1;
        if (!seenCardThisRun.has(cardId)) {
          seenCardThisRun.add(cardId);
          stat.runsWithPurchase += 1;
          if (run.victory) {
            stat.winsWithPurchase += 1;
          }
        }
      } else if (isRelic) {
        const stat = ensureRelic(item);
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
    { timesRemoved: number; runsWithRemoval: number; winsWithRemoval: number; floorSum: number }
  > = {};

  for (const run of runs) {
    const raw: any = run.raw;
    const removed: unknown = raw?.items_purged;
    if (!Array.isArray(removed)) continue;

    const seenThisRun = new Set<string>();
    for (const entry of removed) {
      if (typeof entry !== "string") continue;
      const id = normalizeCardName(entry);

      if (!stats[id]) {
        stats[id] = {
          timesRemoved: 0,
          runsWithRemoval: 0,
          winsWithRemoval: 0,
          floorSum: 0,
        };
      }

      const record = stats[id];
      record.timesRemoved += 1;
      record.floorSum += run.floorReached;

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
      avgFloor:
        data.timesRemoved > 0 ? data.floorSum / data.timesRemoved : 0,
    };
  }

  return result;
}

export type RemovedCardInstance = {
  name: string;
  floor: number | null;
};

export function getRemovedCardsForRun(run: Run): RemovedCardInstance[] {
  const raw: any = run.raw;
  const removed: unknown = raw?.items_purged;
  if (!Array.isArray(removed)) return [];

  // Floor information is not available in the sampled logs, so we surface
  // the card names only and leave floor as null for future extension.
  return removed
    .filter((entry: unknown): entry is string => typeof entry === "string")
    .map((name) => ({
      name,
      floor: null,
    }));
}

export type GoldPoint = {
  floor: number;
  gold: number;
};

export function getGoldPerFloor(run: Run): GoldPoint[] {
  const raw: any = run.raw;
  const goldPerFloor: unknown = raw?.gold_per_floor;
  if (!Array.isArray(goldPerFloor)) return [];

  const points: GoldPoint[] = [];
  for (let i = 0; i < goldPerFloor.length; i += 1) {
    const value = goldPerFloor[i];
    if (typeof value !== "number") continue;
    points.push({ floor: i + 1, gold: value });
  }

  return points;
}

export type ShopPurchase = {
  name: string;
  floor: number | null;
  isCard: boolean;
};

export type ShopVisit = {
  floor: number;
  cards: string[];
  relics: string[];
};

export type RunShopInfo = {
  visits: ShopVisit[];
  cards: ShopPurchase[];
  relics: ShopPurchase[];
};

export function getShopInfoForRun(run: Run): RunShopInfo {
  const raw: any = run.raw;
  const items: unknown = raw?.items_purchased;
  const floors: unknown = raw?.item_purchase_floors;
  const pathPerFloor: unknown = raw?.path_per_floor;

  // Find all shop floors from path_per_floor
  const shopFloors = new Set<number>();
  if (Array.isArray(pathPerFloor)) {
    for (let i = 0; i < pathPerFloor.length; i += 1) {
      const value = pathPerFloor[i];
      if (value === "$") {
        shopFloors.add(i + 1);
      }
    }
  }

  if (!Array.isArray(items)) {
    return { visits: [], cards: [], relics: [] };
  }

  const floorArr: unknown[] = Array.isArray(floors) ? floors : [];

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

  const cardPurchases: ShopPurchase[] = [];
  const relicPurchases: ShopPurchase[] = [];
  const visitsByFloor = new Map<number, { cards: string[]; relics: string[] }>();

  items.forEach((item, index) => {
    if (typeof item !== "string") return;
    const floorValue = floorArr[index];
    const floor =
      typeof floorValue === "number" ? floorValue : (null as number | null);

    const cardId = normalizeCardName(item);
    const isCard = deckIds.has(cardId);
    const isRelic = relicSet.has(item);

    if (isCard) {
      cardPurchases.push({ name: item, floor, isCard: true });
      if (floor !== null) {
        if (!visitsByFloor.has(floor)) {
          visitsByFloor.set(floor, { cards: [], relics: [] });
        }
        visitsByFloor.get(floor)!.cards.push(item);
      }
    } else if (isRelic) {
      relicPurchases.push({ name: item, floor, isCard: false });
      if (floor !== null) {
        if (!visitsByFloor.has(floor)) {
          visitsByFloor.set(floor, { cards: [], relics: [] });
        }
        visitsByFloor.get(floor)!.relics.push(item);
      }
    }
    // Other items (e.g. potions) are currently ignored.
  });

  // Build visits array, including shops with no purchases
  const visits: ShopVisit[] = [];
  for (const floor of shopFloors) {
    const purchases = visitsByFloor.get(floor) || { cards: [], relics: [] };
    visits.push({
      floor,
      cards: purchases.cards,
      relics: purchases.relics,
    });
  }
  // Also include floors with purchases that might not be in path_per_floor
  for (const [floor, purchases] of visitsByFloor.entries()) {
    if (!shopFloors.has(floor)) {
      visits.push({
        floor,
        cards: purchases.cards,
        relics: purchases.relics,
      });
    }
  }
  // Sort by floor
  visits.sort((a, b) => a.floor - b.floor);

  return {
    visits,
    cards: cardPurchases,
    relics: relicPurchases,
  };
}

export type FinalDeckCard = {
  name: string;
  upgraded: boolean;
  isStarting: boolean;
  isAdded: boolean;
};

const BASE_DECK: Record<string, string[]> = {
  IRONCLAD: [
    "Strike_R",
    "Strike_R",
    "Strike_R",
    "Strike_R",
    "Strike_R",
    "Defend_R",
    "Defend_R",
    "Defend_R",
    "Defend_R",
    "Bash",
  ],
  THE_SILENT: [
    "Strike_G",
    "Strike_G",
    "Strike_G",
    "Strike_G",
    "Strike_G",
    "Defend_G",
    "Defend_G",
    "Defend_G",
    "Defend_G",
    "Defend_G",
    "Survivor",
    "Neutralize",
  ],
  DEFECT: [
    "Strike_B",
    "Strike_B",
    "Strike_B",
    "Strike_B",
    "Defend_B",
    "Defend_B",
    "Defend_B",
    "Defend_B",
    "Zap",
    "Dualcast",
  ],
  WATCHER: [
    "Strike_P",
    "Strike_P",
    "Strike_P",
    "Strike_P",
    "Defend_P",
    "Defend_P",
    "Defend_P",
    "Defend_P",
    "Eruption",
    "Vigilance",
  ],
};

export function getFinalDeck(run: Run): FinalDeckCard[] {
  const raw: any = run.raw;
  const masterDeck: unknown = raw?.master_deck;
  if (!Array.isArray(masterDeck)) return [];

  const base = BASE_DECK[run.character] ?? [];
  const baseCounts = new Map<string, number>();
  for (const name of base) {
    const id = normalizeCardName(name);
    baseCounts.set(id, (baseCounts.get(id) ?? 0) + 1);
  }

  const deck: FinalDeckCard[] = [];
  for (const entry of masterDeck) {
    if (typeof entry !== "string") continue;
    const upgraded = entry.includes("+");
    const id = normalizeCardName(entry);
    const remaining = baseCounts.get(id) ?? 0;
    const isStarting = remaining > 0;
    if (isStarting) {
      baseCounts.set(id, remaining - 1);
    }
    deck.push({
      name: entry,
      upgraded,
      isStarting,
      isAdded: !isStarting,
    });
  }

  deck.sort((a, b) => {
    if (a.upgraded !== b.upgraded) {
      return a.upgraded ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return deck;
}

export function getRelicsForRun(run: Run): string[] {
  const raw: any = run.raw;
  const relics: unknown = raw?.relics;
  if (!Array.isArray(relics)) return [];
  return relics.filter((r: unknown): r is string => typeof r === "string");
}

export type CardDecisionRow = {
  floor: number | null;
  picked: string | null;
  skipped: string[];
};

export function getCardDecisionRows(run: Run): CardDecisionRow[] {
  const raw: any = run.raw;
  const choices: unknown = raw?.card_choices;
  if (!Array.isArray(choices)) return [];

  const rows: CardDecisionRow[] = [];
  for (const choice of choices as any[]) {
    const floor =
      typeof choice.floor === "number" ? choice.floor : (null as number | null);
    const picked: string | null =
      typeof choice.picked === "string"
        ? choice.picked
        : typeof choice.picked_card === "string"
          ? choice.picked_card
          : null;
    const notPickedRaw = choice.not_picked ?? choice.not_picked_cards ?? [];
    const skipped: string[] = Array.isArray(notPickedRaw)
      ? notPickedRaw.filter((c: unknown): c is string => typeof c === "string")
      : [];

    rows.push({ floor, picked, skipped });
  }

  return rows;
}

export type PathStep = {
  floor: number;
  symbol: string;
  detail?: string; // Additional info like monster name, event name, rest action, etc.
};

export function getPathOverview(run: Run): PathStep[] {
  const raw: any = run.raw;
  const pathPerFloor: unknown = raw?.path_per_floor;
  const pathTaken: unknown = raw?.path_taken;
  const campfireChoices: unknown = raw?.campfire_choices;
  const damageTaken: unknown = raw?.damage_taken;
  const eventChoices: unknown = raw?.event_choices;
  const relicsObtained: unknown = raw?.relics_obtained;

  const source: unknown[] | null = Array.isArray(pathPerFloor)
    ? pathPerFloor
    : Array.isArray(pathTaken)
      ? pathTaken
      : null;

  if (!source) return [];

  // Build lookup maps for additional details
  const restActions = new Map<number, string>();
  if (Array.isArray(campfireChoices)) {
    for (const choice of campfireChoices) {
      if (typeof choice !== "object" || choice === null) continue;
      const floor = (choice as any).floor;
      const key = (choice as any).key;
      const data = (choice as any).data;
      if (typeof floor === "number") {
        if (key === "REST") {
          restActions.set(floor, "Sleep");
        } else if (key === "SMITH" && typeof data === "string") {
          restActions.set(floor, `Smith, ${data}`);
        }
      }
    }
  }

  const enemyNames = new Map<number, string>();
  if (Array.isArray(damageTaken)) {
    for (const entry of damageTaken) {
      if (typeof entry !== "object" || entry === null) continue;
      const floor = (entry as any).floor;
      const enemies = (entry as any).enemies;
      if (typeof floor === "number" && typeof enemies === "string") {
        enemyNames.set(floor, enemies);
      }
    }
  }

  const eventNames = new Map<number, string>();
  if (Array.isArray(eventChoices)) {
    for (const event of eventChoices) {
      if (typeof event !== "object" || event === null) continue;
      const floor = (event as any).floor;
      const eventName = (event as any).event_name;
      if (typeof floor === "number" && typeof eventName === "string") {
        eventNames.set(floor, eventName);
      }
    }
  }

  const treasureRelics = new Map<number, string>();
  if (Array.isArray(relicsObtained)) {
    for (const relic of relicsObtained) {
      if (typeof relic !== "object" || relic === null) continue;
      const floor = (relic as any).floor;
      const key = (relic as any).key;
      if (typeof floor === "number" && typeof key === "string") {
        treasureRelics.set(floor, key);
      }
    }
  }

  const result: PathStep[] = [];
  for (let i = 0; i < source.length; i += 1) {
    const value = source[i];
    if (typeof value !== "string") continue;
    const floor = i + 1;
    let detail: string | undefined;

    const symbol = value;
    if (symbol === "R") {
      // Rest site - show action
      const action = restActions.get(floor);
      if (action) {
        detail = action;
      }
    } else if (symbol === "M") {
      // Monster - show enemy name
      const enemy = enemyNames.get(floor);
      if (enemy) {
        detail = enemy;
      }
    } else if (symbol === "E") {
      // Elite - show enemy name
      const enemy = enemyNames.get(floor);
      if (enemy) {
        detail = enemy;
      }
    } else if (symbol === "B") {
      // Boss - show boss name
      const boss = enemyNames.get(floor);
      if (boss) {
        detail = boss;
      }
    } else if (symbol === "?") {
      // Event - show event name
      const event = eventNames.get(floor);
      if (event) {
        detail = event;
      }
    } else if (symbol === "T") {
      // Treasure - show relic if obtained
      const relic = treasureRelics.get(floor);
      if (relic) {
        detail = relic;
      }
    }

    result.push({ floor, symbol, detail });
  }

  return result;
}

// TODO: future analytics hooks
// - Synergy analysis between cards/relics
// - Pick rate by act
// - Ascension comparison
// - Deck size vs win rate

