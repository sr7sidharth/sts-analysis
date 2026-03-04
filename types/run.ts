export type GameId = "STS1" | "STS2" | "unknown";

export type Run = {
  /**
   * Local UUID used as the primary key in the UI.
   */
  id: string;
  /**
   * Underlying Slay the Spire play_id, used for deduplication.
   */
  sourcePlayId: string;
  character: string;
  ascensionLevel: number;
  floorReached: number;
  victory: boolean;
  killedBy?: string;
  score: number;
  /**
   * Unix timestamp in seconds from the original log, if available.
   * Falls back to Date.now() / 1000 when parsed.
   */
  timestamp: number;
  /**
   * Which Slay the Spire game this run comes from.
   * Currently best-effort and used to keep analytics scoped while STS2 is in flux.
   */
  game: GameId;
  /**
   * Whether this was a Daily Challenge run (is_daily === true in the raw log).
   */
  isDaily: boolean;
  /**
   * Active modifiers for a Daily Challenge run (daily_mods in the raw log).
   * Empty array for non-daily runs.
   */
  dailyMods: string[];
  /**
   * Full raw run JSON as parsed from the .run/.json file.
   * This is intentionally untyped; analytics code will project what it needs.
   */
  raw: unknown;
};

export type RunResultFilter = "win" | "loss";

export type RunFilters = {
  character?: string;
  ascension?: number;
  result?: RunResultFilter;
};

export type CardStats = {
  offered: number;
  picked: number;
  /**
   * Number of times this card was offered in a reward where the player chose SKIP.
   */
  skipOffers: number;
  /**
   * Number of runs whose final deck contains this card (normalized to base name).
   */
  runsWithCard: number;
  /**
   * Number of wins among runs that contain this card.
   */
  winsWithCard: number;
};

export type RelicStats = {
  runsWithRelic: number;
  winCount: number;
  avgFloor: number;
};

export type OverviewStats = {
  totalRuns: number;
  winRate: number;
  avgFloor: number;
  mostCommonDeath?: string;
};

export type DeckSizeStats = {
  avgDeckSizeAll: number;
  avgDeckSizeWins: number;
  avgDeckSizeLosses: number;
};

export type DeathStats = {
  deathCounts: Record<string, number>;
  averageFloor: number;
  winRate: number;
  mostCommonKilledBy?: string;
};

export type ShopItemStats = {
  bought: number;
  runsWithPurchase: number;
  winsWithPurchase: number;
};

export type RemovedCardStats = {
  timesRemoved: number;
  runsWithRemoval: number;
  winsWithRemoval: number;
};

export type CardOccurrenceStats = {
  id: string;
  runsWithCardOverall: number;
  runsWithCardWins: number;
  runsWithCardLosses: number;
};

export type ShopStats = {
  cards: Record<string, ShopItemStats>;
  relics: Record<string, ShopItemStats>;
};

export type EncounterAverages = {
  monsters: { wins: number; losses: number };
  elites: { wins: number; losses: number };
  shops: { wins: number; losses: number };
  events: { wins: number; losses: number };
  rests: { wins: number; losses: number };
  restSiteUpgrades: { wins: number; losses: number };
  cardRemovals: { wins: number; losses: number };
};
