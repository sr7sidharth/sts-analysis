import type { Run } from "@/types/run";

export function normalizeCardName(name: string): string {
  const plusIndex = name.indexOf("+");
  if (plusIndex === -1) return name;
  return name.slice(0, plusIndex);
}

export function getRaw(run: Run): any {
  return (run.raw as any) ?? {};
}

export function getMasterDeckRaw(run: Run): string[] {
  const raw = getRaw(run);
  const masterDeck: unknown = raw?.master_deck;
  if (!Array.isArray(masterDeck)) return [];
  return masterDeck.filter((entry: unknown): entry is string => typeof entry === "string");
}

export function getRelicsRaw(run: Run): string[] {
  const raw = getRaw(run);
  const relics: unknown = raw?.relics;
  if (!Array.isArray(relics)) return [];
  return relics.filter((entry: unknown): entry is string => typeof entry === "string");
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
  const cardChoices: unknown = raw?.card_choices;
  return Array.isArray(cardChoices) ? cardChoices : [];
}

export function getGoldPerFloorRaw(run: Run): number[] {
  const raw = getRaw(run);
  const goldPerFloor: unknown = raw?.gold_per_floor;
  if (!Array.isArray(goldPerFloor)) return [];
  return goldPerFloor.filter((value: unknown): value is number => typeof value === "number");
}
