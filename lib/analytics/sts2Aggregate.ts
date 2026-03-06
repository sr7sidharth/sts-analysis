import type {
  EncounterAverages,
  Run,
  ShopItemStats,
  ShopStats,
} from "@/types/run";
import { getMasterDeckRaw, getRelicsRaw, normalizeCardName } from "./helpers";
import {
  extractSts2ShopPurchases,
  summarizeSts2Encounters,
} from "./sts2Projection";

/** STS2-specific shop stats. Uses map_point_history shop purchases. */
export function computeSts2ShopStats(runs: Run[]): ShopStats {
  const cardStats: Record<string, ShopItemStats> = {};
  const relicStats: Record<string, ShopItemStats> = {};

  const ensureItem = (
    map: Record<string, ShopItemStats>,
    key: string,
  ): ShopItemStats => {
    if (!map[key]) {
      map[key] = { bought: 0, runsWithPurchase: 0, winsWithPurchase: 0 };
    }
    return map[key];
  };

  for (const run of runs) {
    const masterDeck = getMasterDeckRaw(run);
    const deckIds = new Set<string>();
    for (const entry of masterDeck) {
      deckIds.add(normalizeCardName(entry));
    }

    const relicsList = getRelicsRaw(run);
    const relicSet = new Set<string>(relicsList);

    const seenCardThisRun = new Set<string>();
    const seenRelicThisRun = new Set<string>();

    const purchases = extractSts2ShopPurchases(run);
    const itemsToProcess: { cardId?: string; relicId?: string }[] = [];

    for (const id of purchases.cards) {
      const cardId = normalizeCardName(id);
      if (deckIds.has(cardId)) {
        itemsToProcess.push({ cardId });
      }
    }
    for (const id of purchases.relics) {
      if (relicSet.has(id)) {
        itemsToProcess.push({ relicId: id });
      }
    }

    for (const { cardId, relicId } of itemsToProcess) {
      if (cardId) {
        const stat = ensureItem(cardStats, cardId);
        stat.bought += 1;
        if (!seenCardThisRun.has(cardId)) {
          seenCardThisRun.add(cardId);
          stat.runsWithPurchase += 1;
          if (run.victory) stat.winsWithPurchase += 1;
        }
      } else if (relicId) {
        const stat = ensureItem(relicStats, relicId);
        stat.bought += 1;
        if (!seenRelicThisRun.has(relicId)) {
          seenRelicThisRun.add(relicId);
          stat.runsWithPurchase += 1;
          if (run.victory) stat.winsWithPurchase += 1;
        }
      }
    }
  }

  return { cards: cardStats, relics: relicStats };
}

/** STS2-specific encounter averages. Uses map_point_history. */
export function computeSts2EncounterAverages(runs: Run[]): EncounterAverages {
  const makeBucket = () => ({ wins: 0, losses: 0 });

  const totals = {
    monsters: makeBucket(),
    elites: makeBucket(),
    shops: makeBucket(),
    events: makeBucket(),
    rests: makeBucket(),
    restSiteUpgrades: makeBucket(),
    cardRemovals: makeBucket(),
  };

  let winRuns = 0;
  let lossRuns = 0;

  for (const run of runs) {
    const summary = summarizeSts2Encounters(run);

    const bucket = run.victory
      ? (() => {
          winRuns += 1;
          return "wins";
        })()
      : (() => {
          lossRuns += 1;
          return "losses";
        })();

    (totals.monsters as any)[bucket] += summary.monsters;
    (totals.elites as any)[bucket] += summary.elites;
    (totals.shops as any)[bucket] += summary.shops;
    (totals.events as any)[bucket] += summary.events;
    (totals.rests as any)[bucket] += summary.restSites;
    (totals.restSiteUpgrades as any)[bucket] += summary.smiths;
    (totals.cardRemovals as any)[bucket] += summary.cardRemovals;
  }

  const safeDiv = (value: number, runsCount: number) =>
    runsCount > 0 ? value / runsCount : 0;

  return {
    monsters: {
      wins: safeDiv(totals.monsters.wins, winRuns),
      losses: safeDiv(totals.monsters.losses, lossRuns),
    },
    elites: {
      wins: safeDiv(totals.elites.wins, winRuns),
      losses: safeDiv(totals.elites.losses, lossRuns),
    },
    shops: {
      wins: safeDiv(totals.shops.wins, winRuns),
      losses: safeDiv(totals.shops.losses, lossRuns),
    },
    events: {
      wins: safeDiv(totals.events.wins, winRuns),
      losses: safeDiv(totals.events.losses, lossRuns),
    },
    rests: {
      wins: safeDiv(totals.rests.wins, winRuns),
      losses: safeDiv(totals.rests.losses, lossRuns),
    },
    restSiteUpgrades: {
      wins: safeDiv(totals.restSiteUpgrades.wins, winRuns),
      losses: safeDiv(totals.restSiteUpgrades.losses, lossRuns),
    },
    cardRemovals: {
      wins: safeDiv(totals.cardRemovals.wins, winRuns),
      losses: safeDiv(totals.cardRemovals.losses, lossRuns),
    },
  };
}
