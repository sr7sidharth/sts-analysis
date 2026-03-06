import type { Run } from "@/types/run";
import { getRaw } from "./helpers";

type Sts2Like = any;

export function extractSts2CardChoices(run: Run): any[] {
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return [];

  const choices: any[] = [];

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr)) continue;

      for (const stats of playerStatsArr) {
        if (!stats || typeof stats !== "object") continue;
        const rawChoices: unknown = (stats as any).card_choices;
        if (!Array.isArray(rawChoices)) continue;

        for (const choice of rawChoices) {
          if (!choice || typeof choice !== "object") continue;
          const card: any = (choice as any).card;
          if (!card || typeof card !== "object") continue;

          const id: unknown = card.id;
          const floorAdded: unknown = card.floor_added_to_deck;
          const wasPicked: unknown = (choice as any).was_picked;
          if (typeof id !== "string") continue;

          const floor =
            typeof floorAdded === "number" ? floorAdded : (null as number | null);

          // In STS2, each choice is represented as its own structure; we treat non-picked
          // options as coming from the same group via the surrounding array.
          // To keep a simple STS1-like shape, we accumulate within this array pass.
        }

        // Rebuild an STS1-style group from this card_choices array.
        const group: any = {
          floor: null as number | null,
          picked: null as string | null,
          not_picked: [] as string[],
        };

        for (const choice of rawChoices) {
          if (!choice || typeof choice !== "object") continue;
          const card: any = (choice as any).card;
          if (!card || typeof card !== "object") continue;
          const id: unknown = card.id;
          const floorAdded: unknown = card.floor_added_to_deck;
          const wasPicked: unknown = (choice as any).was_picked;
          if (typeof id !== "string") continue;

          const floor =
            typeof floorAdded === "number" ? floorAdded : group.floor;
          group.floor = floor;

          if (wasPicked === true) {
            group.picked = id;
          } else {
            group.not_picked.push(id);
          }
        }

        // If nothing was explicitly picked but we have candidates, treat as SKIP.
        if (!group.picked && group.not_picked.length > 0) {
          group.picked = "SKIP";
        }

        if (group.picked || group.not_picked.length > 0) {
          choices.push(group);
        }
      }
    }
  }

  return choices;
}

export function extractSts2RemovedCards(run: Run): string[] {
  return extractSts2RemovedCardsWithFloors(run).map((e) => e.id);
}

export interface RemovedCardWithFloor {
  id: string;
  floor: number;
}

export function extractSts2RemovedCardsWithFloors(
  run: Run,
  playerIndex?: number,
): RemovedCardWithFloor[] {
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return [];

  const removed: RemovedCardWithFloor[] = [];
  let floor = 1;

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr)) continue;

      const startIdx =
        typeof playerIndex === "number"
          ? Math.min(Math.max(0, playerIndex), playerStatsArr.length - 1)
          : 0;
      const endIdx =
        typeof playerIndex === "number" ? startIdx + 1 : playerStatsArr.length;

      for (let i = startIdx; i < endIdx; i += 1) {
        const stats = playerStatsArr[i];
        if (!stats || typeof stats !== "object") continue;
        const cardsRemoved: unknown = (stats as any).cards_removed;
        if (Array.isArray(cardsRemoved)) {
          for (const entry of cardsRemoved) {
            if (!entry || typeof entry !== "object") continue;
            const id: unknown = (entry as any).id;
            if (typeof id === "string") {
              removed.push({ id, floor });
            }
          }
        }
      }

      floor += 1;
    }
  }

  return removed;
}

export interface Sts2ShopPurchases {
  cards: string[];
  relics: string[];
}

export function extractSts2ShopPurchases(run: Run): Sts2ShopPurchases {
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return { cards: [], relics: [] };

  const cards: string[] = [];
  const relics: string[] = [];

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      if ((point as any).map_point_type !== "shop") continue;

      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr)) continue;

      for (const stats of playerStatsArr) {
        if (!stats || typeof stats !== "object") continue;

        const boughtRelics: unknown = (stats as any).bought_relics;
        if (Array.isArray(boughtRelics)) {
          for (const r of boughtRelics) {
            if (typeof r === "string") relics.push(r);
          }
        }

        // Shop card purchases are recorded in cards_gained at shop points
        const cardsGained: unknown = (stats as any).cards_gained;
        if (Array.isArray(cardsGained)) {
          for (const entry of cardsGained) {
            if (entry && typeof entry === "object") {
              const id: unknown = (entry as any).id;
              if (typeof id === "string") cards.push(id);
            }
          }
        }

        // Fallback: card_choices with was_picked (some runs may use this)
        const rawChoices: unknown = (stats as any).card_choices;
        if (Array.isArray(rawChoices)) {
          for (const choice of rawChoices) {
            if (!choice || typeof choice !== "object") continue;
            const card: any = (choice as any).card;
            if (!card || typeof card !== "object") continue;
            if ((choice as any).was_picked === true) {
              const id: unknown = card.id;
              if (typeof id === "string") cards.push(id);
            }
          }
        }
      }
    }
  }

  return { cards, relics };
}

export interface Sts2EncounterSummary {
  monsters: number;
  elites: number;
  shops: number;
  events: number;
  restSites: number;
  smiths: number;
  cardRemovals: number;
}

export function summarizeSts2Encounters(run: Run): Sts2EncounterSummary {
  const raw = getRaw(run) as Sts2Like;
  const summary: Sts2EncounterSummary = {
    monsters: 0,
    elites: 0,
    shops: 0,
    events: 0,
    restSites: 0,
    smiths: 0,
    cardRemovals: 0,
  };

  if (!Array.isArray(raw?.map_point_history)) return summary;

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const type: string = (point as any).map_point_type ?? "";

      switch (type) {
        case "monster":
          summary.monsters += 1;
          break;
        case "elite":
          summary.elites += 1;
          break;
        case "boss":
          summary.elites += 1;
          break;
        case "shop":
          summary.shops += 1;
          break;
        case "unknown":
          summary.events += 1;
          break;
        case "rest_site":
        case "ancient":
          summary.restSites += 1;
          break;
        default:
          break;
      }

      const playerStatsArr: unknown = (point as any).player_stats;
      if (Array.isArray(playerStatsArr)) {
        for (const stats of playerStatsArr) {
          if (!stats || typeof stats !== "object") continue;
          const choices: unknown = (stats as any).rest_site_choices;
          if (Array.isArray(choices) && choices.includes("SMITH")) {
            summary.smiths += 1;
          }
        }
      }
    }
  }

  summary.cardRemovals = extractSts2RemovedCards(run).length;
  return summary;
}

const MAP_POINT_TO_SYMBOL: Record<string, string> = {
  monster: "M",
  elite: "E",
  boss: "B",
  shop: "$",
  rest_site: "R",
  treasure: "T",
  ancient: "?",
  unknown: "?",
};

export function getSts2PathPerFloor(run: Run): string[] {
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return [];

  const path: string[] = [];
  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const type: string = (point as any).map_point_type ?? "";
      const symbol = MAP_POINT_TO_SYMBOL[type] ?? "?";
      path.push(symbol);
    }
  }
  return path;
}

export function getSts2GoldPerFloor(run: Run, playerIndex?: number): number[] {
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return [];

  const gold: number[] = [];
  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr) || playerStatsArr.length === 0) {
        gold.push(0);
        continue;
      }
      const idx =
        typeof playerIndex === "number"
          ? Math.min(Math.max(0, playerIndex), playerStatsArr.length - 1)
          : 0;
      const stats = playerStatsArr[idx];
      const g =
        stats && typeof stats === "object"
          ? (stats as any).current_gold
          : undefined;
      gold.push(typeof g === "number" ? g : 0);
    }
  }
  return gold;
}

export interface Sts2ShopVisit {
  floor: number;
  cards: string[];
  relics: string[];
}

export function getSts2ShopVisits(
  run: Run,
  playerIndex?: number,
): Sts2ShopVisit[] {
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return [];

  const visits: Sts2ShopVisit[] = [];
  let floor = 1;

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      if ((point as any).map_point_type !== "shop") {
        floor += 1;
        continue;
      }

      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr) || playerStatsArr.length === 0) {
        visits.push({ floor, cards: [], relics: [] });
        floor += 1;
        continue;
      }

      const idx =
        typeof playerIndex === "number"
          ? Math.min(Math.max(0, playerIndex), playerStatsArr.length - 1)
          : 0;
      const stats = playerStatsArr[idx];
      const cards: string[] = [];
      const relics: string[] = [];

      if (stats && typeof stats === "object") {
        const cardsGained: unknown = (stats as any).cards_gained;
        if (Array.isArray(cardsGained)) {
          for (const entry of cardsGained) {
            if (entry && typeof entry === "object") {
              const id: unknown = (entry as any).id;
              if (typeof id === "string") cards.push(id);
            }
          }
        }
        const boughtRelics: unknown = (stats as any).bought_relics;
        if (Array.isArray(boughtRelics)) {
          for (const r of boughtRelics) {
            if (typeof r === "string") relics.push(r);
          }
        }
      }

      visits.push({ floor, cards, relics });
      floor += 1;
    }
  }

  return visits;
}

export interface CardDecisionContext {
  relics: string[];
  deck: string[];
  gold: number;
  potions: string[];
}

function buildDeckAtFloor(
  raw: Sts2Like,
  floor: number,
  playerIndex: number,
  removedByFloor: Map<number, string[]>,
): string[] {
  const player = raw?.players?.[playerIndex];
  const finalDeck = Array.isArray(player?.deck) ? player.deck : [];
  const removedCount = new Map<string, number>();
  for (let f = 1; f <= floor; f += 1) {
    for (const id of removedByFloor.get(f) ?? []) {
      removedCount.set(id, (removedCount.get(id) ?? 0) + 1);
    }
  }
  const deck: string[] = [];
  const seenCount = new Map<string, number>();
  for (const c of finalDeck) {
    const id = c?.id;
    if (typeof id !== "string") continue;
    const addedAt = typeof c?.floor_added_to_deck === "number" ? c.floor_added_to_deck : 1;
    if (addedAt > floor) continue;
    const inFinal = finalDeck.filter((x: any) => x?.id === id).length;
    const removed = removedCount.get(id) ?? 0;
    const atFloor = inFinal - removed;
    const added = seenCount.get(id) ?? 0;
    if (added < atFloor) {
      deck.push(id);
      seenCount.set(id, added + 1);
    }
  }
  return deck;
}

export function getSts2CardDecisionContextMap(
  run: Run,
  playerIndex?: number,
): Map<number, CardDecisionContext> {
  const raw = getRaw(run) as Sts2Like;
  const result = new Map<number, CardDecisionContext>();
  if (!Array.isArray(raw?.map_point_history)) return result;

  const idx = Math.min(
    Math.max(0, playerIndex ?? 0),
    Math.max(0, (raw?.players?.length ?? 1) - 1),
  );

  const removedByFloor = new Map<number, string[]>();
  let floor = 1;
  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      const statsArr = (point as any)?.player_stats;
      const stats = Array.isArray(statsArr) ? statsArr[idx] : null;
      if (stats?.cards_removed) {
        const ids = (stats.cards_removed as any[])
          .map((e) => e?.id)
          .filter((id): id is string => typeof id === "string");
        removedByFloor.set(floor, ids);
      }
      floor += 1;
    }
  }

  const relics: string[] = [];
  const potions: string[] = [];
  floor = 1;

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr) || playerStatsArr.length === 0) {
        floor += 1;
        continue;
      }

      const stats = playerStatsArr[idx] as any;

      if (stats?.card_choices?.length > 0) {
        const deck = buildDeckAtFloor(raw, floor - 1, idx, removedByFloor);
        result.set(floor, {
          relics: [...relics],
          deck,
          gold: typeof stats.current_gold === "number" ? stats.current_gold : 0,
          potions: [...potions],
        });
      }

      if (stats?.relic_choices) {
        for (const r of stats.relic_choices) {
          if (r?.was_picked && r?.choice) relics.push(r.choice);
        }
      }
      if (stats?.bought_relics) {
        for (const r of stats.bought_relics) {
          if (typeof r === "string") relics.push(r);
        }
      }
      if (stats?.potion_choices) {
        for (const p of stats.potion_choices) {
          if (p?.was_picked && p?.choice) potions.push(p.choice);
        }
      }
      if (stats?.potion_used) {
        for (const p of stats.potion_used) {
          const i = potions.indexOf(p);
          if (i >= 0) potions.splice(i, 1);
        }
      }

      floor += 1;
    }
  }

  return result;
}

