import type {
  CardOccurrenceStats,
  CardStats,
  DeckSizeStats,
  DeathStats,
  EncounterAverages,
  GameId,
  OverviewStats,
  RelicSizeStats,
  RelicStats,
  RemovedCardStats,
  Run,
  ShopStats,
} from "@/types/run";

export type SupportedGameId = Exclude<GameId, "unknown">;

export interface GameAnalyticsStrategy {
  game: SupportedGameId;

  // Aggregate-level analytics
  computeOverviewStats(runs: Run[]): OverviewStats;
  computeDeathStats(runs: Run[]): DeathStats;
  computeCardStats(runs: Run[]): Record<string, CardStats>;
  computeCardOccurrenceStats(runs: Run[]): CardOccurrenceStats[];
  computeRelicStats(runs: Run[]): Record<string, RelicStats>;
  computeShopStats(runs: Run[]): ShopStats;
  computeRemovedCardStats(runs: Run[]): Record<string, RemovedCardStats>;
  computeDeckSizeStats(runs: Run[]): DeckSizeStats;
  computeRelicSizeStats(runs: Run[]): RelicSizeStats;
  computeEncounterAverages(runs: Run[]): EncounterAverages;
}

