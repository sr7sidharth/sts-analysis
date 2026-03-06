/** Shared analytics types used across STS1 and STS2 logic. */

export interface CardDecisionContext {
  relics: string[];
  deck: string[];
  gold: number;
  potions: string[];
}

export type ItemWithFloor = { id: string; floor?: number };
