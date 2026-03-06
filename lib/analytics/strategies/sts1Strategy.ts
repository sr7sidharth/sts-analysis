import type { Run } from "@/types/run";
import {
  computeCardOccurrenceStats,
  computeCardStats,
  computeDeathStats,
  computeDeckSizeStats,
  computeEncounterAverages,
  computeOverviewStats,
  computeRelicSizeStats,
  computeRelicStats,
  computeRemovedCardStats,
  computeShopStats,
} from "../aggregate";
import type { GameAnalyticsStrategy } from "./types";

export const sts1AnalyticsStrategy: GameAnalyticsStrategy = {
  game: "STS1",

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

  computeRelicSizeStats(runs: Run[]) {
    return computeRelicSizeStats(runs);
  },

  computeEncounterAverages(runs: Run[]) {
    return computeEncounterAverages(runs);
  },
};

