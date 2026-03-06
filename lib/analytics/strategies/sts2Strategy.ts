import type { Run } from "@/types/run";
import {
  computeCardOccurrenceStats,
  computeCardStats,
  computeDeathStats,
  computeDeckSizeStats,
  computeEncounterAverages,
  computeOverviewStats,
  computeRelicStats,
  computeRemovedCardStats,
  computeShopStats,
} from "../aggregate";
import type { GameAnalyticsStrategy } from "./types";

// For now, STS2 shares the same aggregate calculations as STS1, operating on
// the normalized Run type. STS2-specific behavior is implemented in helpers
// and parser normalization, so this strategy remains a thin wrapper.
export const sts2AnalyticsStrategy: GameAnalyticsStrategy = {
  game: "STS2",

  computeOverviewStats(runs: Run[]) {
    return computeOverviewStats(runs);
  },

  computeDeathStats(runs: Run[]) {
    return computeDeathStats(runs);
  },

  computeCardStats(runs: Run[]) {
    return computeCardStats(runs);
  },

  computeCardOccurrenceStats(runs: Run[]) {
    return computeCardOccurrenceStats(runs);
  },

  computeRelicStats(runs: Run[]) {
    return computeRelicStats(runs);
  },

  computeShopStats(runs: Run[]) {
    return computeShopStats(runs);
  },

  computeRemovedCardStats(runs: Run[]) {
    return computeRemovedCardStats(runs);
  },

  computeDeckSizeStats(runs: Run[]) {
    return computeDeckSizeStats(runs);
  },

  computeEncounterAverages(runs: Run[]) {
    return computeEncounterAverages(runs);
  },
};

