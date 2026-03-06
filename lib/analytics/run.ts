import type { Run } from "@/types/run";
import type { CardDecisionContext, ItemWithFloor } from "./types";
import {
  getCardChoicesRaw,
  getCampfireChoicesRaw,
  getGoldPerFloorRaw,
  getItemsPurgedRaw,
  getMasterDeckRaw,
  getPathPerFloorRaw,
  getRelicsRaw,
  getRaw,
  normalizeCardName,
} from "./helpers";
import {
  extractSts2RemovedCardsWithFloors,
  getSts2CardDecisionContextMap,
  getSts2ShopVisits,
} from "./sts2Projection";

// ── Per-run types (private to analytics module) ───────────────────────────────

type FinalDeckCard = {
  name: string;
  upgraded: boolean;
  isStarting: boolean;
  isAdded: boolean;
};

type CardDecisionRow = {
  floor: number | null;
  picked: string | null;
  skipped: string[];
};

type PathStep = {
  floor: number;
  symbol: string;
  detail?: string;
};

type GoldPoint = {
  floor: number;
  gold: number;
};

type ShopVisit = {
  floor: number;
  cards: string[];
  relics: string[];
};

// ── Starting deck lookup ──────────────────────────────────────────────────────

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

// ── Exports ───────────────────────────────────────────────────────────────────

export function getFinalDeck(run: Run, playerIndex?: number): FinalDeckCard[] {
  // STS2: derive directly from the player's deck objects.
  if (run.game === "STS2") {
    const raw = getRaw(run);
    const players = Array.isArray(raw?.players) ? raw.players : [];
    const idx = Math.min(Math.max(0, playerIndex ?? 0), players.length - 1);
    const primary = players.length > 0 ? players[idx] : undefined;
    const deckRaw: unknown = primary?.deck;
    if (!Array.isArray(deckRaw)) return [];

    const deck: FinalDeckCard[] = [];
    for (const entry of deckRaw) {
      if (!entry || typeof entry !== "object") continue;
      const id: unknown = (entry as any).id;
      if (typeof id !== "string") continue;
      const upgradeLevel: unknown = (entry as any).current_upgrade_level;
      const floorAdded: unknown = (entry as any).floor_added_to_deck;
      const upgraded = typeof upgradeLevel === "number" && upgradeLevel > 0;

      // For now, treat floor 1 cards as starting, others as added.
      const isStarting = floorAdded === 1;
      const isAdded = !isStarting;

      const name = upgraded ? `${id}+${upgradeLevel}` : id;
      deck.push({ name, upgraded, isStarting, isAdded });
    }

    deck.sort((a, b) => {
      if (a.isStarting !== b.isStarting) return a.isStarting ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return deck;
  }

  const masterDeck = getMasterDeckRaw(run);
  if (masterDeck.length === 0) return [];

  // Build a multiset of cards picked from card_choices (reward selections).
  // These are definitively "added" cards regardless of whether they share a
  // base name with a starting card. We also include shop-purchased cards via
  // items_purchased so the entire "obtained during run" set is covered.
  const pickedCounts = new Map<string, number>();
  const cardChoices = getCardChoicesRaw(run);
  for (const choice of cardChoices) {
    const picked: unknown = choice.picked ?? choice.picked_card;
    if (typeof picked === "string" && picked !== "SKIP" && picked !== "") {
      const id = normalizeCardName(picked);
      pickedCounts.set(id, (pickedCounts.get(id) ?? 0) + 1);
    }
  }

  // Include cards bought at shop: items_purchased that are cards (in master_deck).
  const raw = getRaw(run);
  const itemsPurchased: unknown = raw?.items_purchased;
  const deckSet = new Set(masterDeck.map(normalizeCardName));
  if (Array.isArray(itemsPurchased)) {
    for (const item of itemsPurchased) {
      if (typeof item !== "string") continue;
      const id = normalizeCardName(item);
      if (deckSet.has(id)) {
        pickedCounts.set(id, (pickedCounts.get(id) ?? 0) + 1);
      }
    }
  }

  // Starting deck: how many of each base-name card the character starts with.
  const base = BASE_DECK[run.character] ?? [];
  const baseCounts = new Map<string, number>();
  for (const name of base) {
    const id = normalizeCardName(name);
    baseCounts.set(id, (baseCounts.get(id) ?? 0) + 1);
  }

  // Classify each card in master_deck.
  // Strategy: first attribute cards to picked/purchased budget, then to starting.
  // This correctly handles cases like drafting "Bash+" when you already have
  // "Bash" in your starting deck.
  const remainingPicked = new Map(pickedCounts);
  const remainingBase = new Map(baseCounts);

  const deck: FinalDeckCard[] = [];
  for (const entry of masterDeck) {
    const upgraded = entry.includes("+");
    const id = normalizeCardName(entry);

    const pickedLeft = remainingPicked.get(id) ?? 0;
    if (pickedLeft > 0) {
      remainingPicked.set(id, pickedLeft - 1);
      deck.push({ name: entry, upgraded, isStarting: false, isAdded: true });
      continue;
    }

    const baseLeft = remainingBase.get(id) ?? 0;
    if (baseLeft > 0) {
      remainingBase.set(id, baseLeft - 1);
      deck.push({ name: entry, upgraded, isStarting: true, isAdded: false });
      continue;
    }

    // Not in starting deck and not in tracked picks — treat as added
    // (e.g. obtained via event or other mechanism not in card_choices).
    deck.push({ name: entry, upgraded, isStarting: false, isAdded: true });
  }

  deck.sort((a, b) => {
    // Starting cards first, then added; within each group sort by name.
    if (a.isStarting !== b.isStarting) return a.isStarting ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return deck;
}

export function getRelicsForRun(run: Run, playerIndex?: number): string[] {
  return getRelicsRaw(run, playerIndex);
}

/**
 * Returns the number of potions used in a run (STS2 only).
 * Counts potion_used entries in map_point_history.
 * May be inaccurate if potions are generated within combat.
 */
export function getPotionsUsed(run: Run, playerIndex?: number): number | null {
  if (run.game !== "STS2") return null;
  const raw: any = getRaw(run);
  if (!Array.isArray(raw?.map_point_history)) return null;

  const players = Array.isArray(raw?.players) ? raw.players : [];
  const idx = Math.min(Math.max(0, playerIndex ?? 0), Math.max(0, players.length - 1));

  let count = 0;
  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const statsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(statsArr)) continue;
      const stats = statsArr[idx];
      if (!stats || typeof stats !== "object") continue;
      const used: unknown = (stats as any).potion_used;
      if (Array.isArray(used)) {
        count += used.length;
      }
    }
  }
  return count;
}

export function getRelicsWithFloors(
  run: Run,
  playerIndex?: number,
): ItemWithFloor[] {
  const raw = getRaw(run);
  if (run.game === "STS2" && Array.isArray(raw?.players) && raw.players.length > 0) {
    const idx = Math.min(
      Math.max(0, playerIndex ?? 0),
      raw.players.length - 1,
    );
    const relics: unknown = raw.players[idx]?.relics;
    if (!Array.isArray(relics)) return [];
    return relics
      .filter((r: any) => r && typeof r.id === "string")
      .map((r: any) => ({
        id: r.id,
        floor: typeof r.floor_added_to_deck === "number" ? r.floor_added_to_deck : undefined,
      }));
  }
  const ids = getRelicsRaw(run, playerIndex);
  return ids.map((id) => ({ id, floor: undefined }));
}

export function getRemovedCardsWithFloors(
  run: Run,
  playerIndex?: number,
): ItemWithFloor[] {
  if (run.game === "STS2") {
    return extractSts2RemovedCardsWithFloors(run, playerIndex);
  }
  const ids = getItemsPurgedRaw(run);
  return ids.map((id) => ({ id, floor: undefined }));
}

export function getCardDecisionRows(run: Run): CardDecisionRow[] {
  const choices = getCardChoicesRaw(run);
  if (choices.length === 0) return [];

  const rows: CardDecisionRow[] = [];
  for (const choice of choices) {
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

export function getCardDecisionContext(
  run: Run,
  floor: number,
  playerIndex?: number,
): CardDecisionContext | null {
  if (run.game === "STS2") {
    const map = getSts2CardDecisionContextMap(run, playerIndex);
    return map.get(floor) ?? null;
  }
  return null;
}

export function getPathOverview(run: Run): PathStep[] {
  const raw = getRaw(run);
  const campfireChoices: unknown = raw?.campfire_choices;
  const damageTaken: unknown = raw?.damage_taken;
  const eventChoices: unknown = raw?.event_choices;
  const relicsObtained: unknown = raw?.relics_obtained;

  const source = getPathPerFloorRaw(run);
  if (source.length === 0) return [];

  // Compute act-start floors from boss positions in path_per_floor.
  // Each time a "B" (boss) appears at absolute floor F, the next act starts at F+1.
  // This lets us convert absolute floors to per-act relative floors for lookup
  // tables (like damage_taken) that may use per-act floor numbers.
  const actStartFloors: number[] = [1];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === "B") {
      actStartFloors.push(i + 2); // next act starts at absolute floor i+2
    }
  }

  const toRelativeFloor = (absoluteFloor: number): number => {
    let actStart = 1;
    for (const start of actStartFloors) {
      if (start <= absoluteFloor) {
        actStart = start;
      } else {
        break;
      }
    }
    return absoluteFloor - actStart + 1;
  };

  // Rest site actions (campfire choices always use absolute floor numbers in STS).
  const restActions = new Map<number, string>();
  if (run.game === "STS2" && Array.isArray((raw as any)?.map_point_history)) {
    let floor = 1;
    for (const act of (raw as any).map_point_history) {
      if (!Array.isArray(act)) continue;
      for (const point of act) {
        if (!point || typeof point !== "object") continue;
        if ((point as any).map_point_type === "rest_site") {
          const statsArr = (point as any).player_stats;
          const choices = Array.isArray(statsArr) && statsArr[0]
            ? (statsArr[0] as any).rest_site_choices
            : undefined;
          if (Array.isArray(choices) && choices.includes("SMITH")) {
            restActions.set(floor, "Smith");
          } else {
            restActions.set(floor, "Sleep");
          }
        }
        floor += 1;
      }
    }
  } else if (Array.isArray(campfireChoices)) {
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
        } else if (key === "LIFT") {
          restActions.set(floor, "Lift");
        } else if (key === "DIG") {
          restActions.set(floor, "Dig");
        } else if (key === "RECALL") {
          restActions.set(floor, "Recall");
        } else if (typeof key === "string") {
          restActions.set(floor, key);
        }
      }
    }
  }

  // damage_taken can use either absolute or per-act relative floor numbers
  // depending on the game version / logging tool. We index both and prefer
  // the absolute lookup first; fall back to per-act relative at render time.
  const enemyNamesAbsolute = new Map<number, string>();
  const enemyNamesRelative = new Map<number, string>();
  if (Array.isArray(damageTaken)) {
    for (const entry of damageTaken) {
      if (typeof entry !== "object" || entry === null) continue;
      const floor = (entry as any).floor;
      const enemies = (entry as any).enemies;
      if (typeof floor === "number" && typeof enemies === "string") {
        enemyNamesAbsolute.set(floor, enemies);
        enemyNamesRelative.set(floor, enemies);
      }
    }
  }

  const getEnemyName = (absoluteFloor: number): string | undefined => {
    const byAbsolute = enemyNamesAbsolute.get(absoluteFloor);
    if (byAbsolute) return byAbsolute;
    const rel = toRelativeFloor(absoluteFloor);
    return enemyNamesRelative.get(rel);
  };

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
    const symbol = source[i];
    const floor = i + 1;
    let detail: string | undefined;

    if (symbol === "R") {
      detail = restActions.get(floor);
    } else if (symbol === "M" || symbol === "E" || symbol === "B") {
      detail = getEnemyName(floor);
    } else if (symbol === "?") {
      detail = eventNames.get(floor) ?? getEnemyName(floor);
    } else if (symbol === "T") {
      detail = treasureRelics.get(floor);
    }

    result.push({ floor, symbol, detail });
  }

  return result;
}

/**
 * Returns shop visits for a run, indexed by floor.
 * Only visits are returned; use `.visits` to get per-floor purchase lists.
 */
export function getShopVisitsForRun(
  run: Run,
  playerIndex?: number,
): ShopVisit[] {
  if (run.game === "STS2") {
    return getSts2ShopVisits(run, playerIndex);
  }
  const raw = getRaw(run);
  const items: unknown = raw?.items_purchased;
  const floors: unknown = raw?.item_purchase_floors;
  const pathPerFloor: unknown = raw?.path_per_floor;

  const shopFloors = new Set<number>();
  if (Array.isArray(pathPerFloor)) {
    for (let i = 0; i < pathPerFloor.length; i += 1) {
      if (pathPerFloor[i] === "$") {
        shopFloors.add(i + 1);
      }
    }
  }

  if (!Array.isArray(items)) {
    return Array.from(shopFloors).map((floor) => ({ floor, cards: [], relics: [] }));
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

  const visitsByFloor = new Map<number, { cards: string[]; relics: string[] }>();

  items.forEach((item, index) => {
    if (typeof item !== "string") return;
    const floorValue = floorArr[index];
    const floor =
      typeof floorValue === "number" ? floorValue : (null as number | null);

    const cardId = normalizeCardName(item);
    const isCard = deckIds.has(cardId);
    const isRelic = relicSet.has(item);

    if ((isCard || isRelic) && floor !== null) {
      if (!visitsByFloor.has(floor)) {
        visitsByFloor.set(floor, { cards: [], relics: [] });
      }
      const visit = visitsByFloor.get(floor)!;
      if (isCard) {
        visit.cards.push(item);
      } else {
        visit.relics.push(item);
      }
    }
  });

  // Build visits array: include all shop floors, with or without purchases.
  const visits: ShopVisit[] = [];
  for (const floor of shopFloors) {
    const purchases = visitsByFloor.get(floor) ?? { cards: [], relics: [] };
    visits.push({ floor, cards: purchases.cards, relics: purchases.relics });
  }
  // Include floors with purchases not in path_per_floor.
  for (const [floor, purchases] of visitsByFloor.entries()) {
    if (!shopFloors.has(floor)) {
      visits.push({ floor, cards: purchases.cards, relics: purchases.relics });
    }
  }
  visits.sort((a, b) => a.floor - b.floor);

  return visits;
}

export function getGoldPerFloor(run: Run, playerIndex?: number): GoldPoint[] {
  const goldPerFloor = getGoldPerFloorRaw(run, playerIndex);
  return goldPerFloor.map((gold, i) => ({ floor: i + 1, gold }));
}

