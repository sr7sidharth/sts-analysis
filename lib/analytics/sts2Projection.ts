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
  const raw = getRaw(run) as Sts2Like;
  if (!Array.isArray(raw?.map_point_history)) return [];

  const removed: string[] = [];

  for (const act of raw.map_point_history) {
    if (!Array.isArray(act)) continue;
    for (const point of act) {
      if (!point || typeof point !== "object") continue;
      const playerStatsArr: unknown = (point as any).player_stats;
      if (!Array.isArray(playerStatsArr)) continue;

      for (const stats of playerStatsArr) {
        if (!stats || typeof stats !== "object") continue;
        const cardsRemoved: unknown = (stats as any).cards_removed;
        if (!Array.isArray(cardsRemoved)) continue;

        for (const entry of cardsRemoved) {
          if (!entry || typeof entry !== "object") continue;
          const id: unknown = (entry as any).id;
          if (typeof id === "string") {
            removed.push(id);
          }
        }
      }
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

        const rawChoices: unknown = (stats as any).card_choices;
        if (!Array.isArray(rawChoices)) continue;
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

