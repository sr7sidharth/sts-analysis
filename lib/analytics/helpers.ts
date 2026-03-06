import type { Run } from "@/types/run";
import { extractSts2CardChoices, extractSts2RemovedCards } from "./sts2Projection";

export function normalizeCardName(name: string): string {
  const plusIndex = name.indexOf("+");
  if (plusIndex === -1) return name;
  return name.slice(0, plusIndex);
}

export function getRaw(run: Run): any {
  return (run.raw as any) ?? {};
}

export function getMasterDeckRaw(run: Run, playerIndex?: number): string[] {
  const raw = getRaw(run);
  // STS1: master_deck is an array of strings.
  const masterDeck: unknown = raw?.master_deck;
  if (Array.isArray(masterDeck)) {
    return masterDeck.filter(
      (entry: unknown): entry is string => typeof entry === "string",
    );
  }

  // STS2: derive from players[playerIndex].deck.
  if (run.game === "STS2" && Array.isArray(raw?.players) && raw.players.length > 0) {
    const idx = Math.min(
      Math.max(0, playerIndex ?? 0),
      raw.players.length - 1,
    );
    const primary = raw.players[idx];
    const deck: unknown = primary.deck;
    if (!Array.isArray(deck)) return [];

    const result: string[] = [];
    for (const card of deck) {
      if (!card || typeof card !== "object") continue;
      const id: unknown = (card as any).id;
      if (typeof id !== "string") continue;
      const upgradeLevel: unknown = (card as any).current_upgrade_level;
      if (typeof upgradeLevel === "number" && upgradeLevel > 0) {
        result.push(`${id}+${upgradeLevel}`);
      } else {
        result.push(id);
      }
    }
    return result;
  }

  return [];
}

export function getRelicsRaw(run: Run, playerIndex?: number): string[] {
  const raw = getRaw(run);
  // STS1: relics is an array of strings.
  const relics: unknown = raw?.relics;
  if (Array.isArray(relics)) {
    return relics.filter(
      (entry: unknown): entry is string => typeof entry === "string",
    );
  }

  // STS2: players[playerIndex].relics is an array of objects with id.
  if (run.game === "STS2" && Array.isArray(raw?.players) && raw.players.length > 0) {
    const idx = Math.min(
      Math.max(0, playerIndex ?? 0),
      raw.players.length - 1,
    );
    const primary = raw.players[idx];
    const rawRelics: unknown = primary.relics;
    if (!Array.isArray(rawRelics)) return [];
    return rawRelics
      .map((r: any) => r?.id)
      .filter((id: unknown): id is string => typeof id === "string");
  }

  return [];
}

export function getPathPerFloorRaw(run: Run): string[] {
  const raw = getRaw(run);
  const pathPerFloor: unknown = raw?.path_per_floor;
  const pathTaken: unknown = raw?.path_taken;
  const source: unknown[] | null = Array.isArray(pathPerFloor)
    ? pathPerFloor
    : Array.isArray(pathTaken)
      ? pathTaken
      : null;
  if (!source) return [];
  return source.filter((value: unknown): value is string => typeof value === "string");
}

export function getItemsPurgedRaw(run: Run): string[] {
  const raw = getRaw(run);
  if (run.game === "STS2") {
    return extractSts2RemovedCards(run);
  }
  const removed: unknown = raw?.items_purged;
  if (!Array.isArray(removed)) return [];
  return removed.filter((entry: unknown): entry is string => typeof entry === "string");
}

export function getCampfireChoicesRaw(run: Run): any[] {
  const raw = getRaw(run);
  const campfireChoices: unknown = raw?.campfire_choices;
  return Array.isArray(campfireChoices) ? campfireChoices : [];
}

export function getCardChoicesRaw(run: Run): any[] {
  const raw = getRaw(run);
  if (run.game === "STS2") {
    return extractSts2CardChoices(run);
  }
  const cardChoices: unknown = raw?.card_choices;
  return Array.isArray(cardChoices) ? cardChoices : [];
}

export function getGoldPerFloorRaw(run: Run): number[] {
  const raw = getRaw(run);
  const goldPerFloor: unknown = raw?.gold_per_floor;
  if (!Array.isArray(goldPerFloor)) return [];
  return goldPerFloor.filter((value: unknown): value is number => typeof value === "number");
}
