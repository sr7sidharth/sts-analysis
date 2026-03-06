import type { GameId } from "@/types/run";
import type { GameAnalyticsStrategy, SupportedGameId } from "./types";
import { sts1AnalyticsStrategy } from "./sts1Strategy";
import { sts2AnalyticsStrategy } from "./sts2Strategy";

const STRATEGIES: Record<SupportedGameId, GameAnalyticsStrategy> = {
  STS1: sts1AnalyticsStrategy,
  STS2: sts2AnalyticsStrategy,
};

export function getAnalyticsStrategyForGame(game: GameId): GameAnalyticsStrategy {
  if (game === "STS2") {
    return STRATEGIES.STS2;
  }
  // Default to STS1 for unknown/legacy runs.
  return STRATEGIES.STS1;
}

export type { GameAnalyticsStrategy, SupportedGameId } from "./types";

