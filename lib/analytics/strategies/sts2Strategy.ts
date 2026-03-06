import type { Run } from "@/types/run";
import {
  computeCardOccurrenceStats,
  computeCardStats,
  computeDeathStats,
  computeDeckSizeStats,
  computeOverviewStats,
  computeRelicSizeStats,
  computeRelicStats,
  computeRemovedCardStats,
} from "../aggregate";
import {
  computeSts2EncounterAverages,
  computeSts2ShopStats,
} from "../sts2Aggregate";
import type { GameAnalyticsStrategy } from "./types";

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
    return computeSts2ShopStats(runs);
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
    return computeSts2EncounterAverages(runs);
  },
};

