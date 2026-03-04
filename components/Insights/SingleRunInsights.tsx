"use client";

import type { Run } from "@/types/run";
import {
  getCardDecisionRows,
  getFinalDeck,
  getPathOverview,
  getRelicsForRun,
  getRemovedCardsForRun,
  getShopInfoForRun,
  getGoldPerFloor,
} from "@/lib/analytics";
import { ScrollableTable } from "@/components/ScrollableTable";

const SYMBOL_LABEL: Record<string, string> = {
  M: "Monster",
  E: "Elite",
  B: "Boss",
  R: "Rest",
  $: "Shop",
  "?": "Event",
  T: "Treasure",
};

type SingleRunInsightsProps = {
  run: Run;
};

export function SingleRunInsights({ run }: SingleRunInsightsProps) {
  const deck = getFinalDeck(run);
  const relics = getRelicsForRun(run);
  const decisions = getCardDecisionRows(run);
  const path = getPathOverview(run);
  const removedCards = getRemovedCardsForRun(run);
  const shopInfo = getShopInfoForRun(run);
  const goldPoints = getGoldPerFloor(run);

  const date =
    typeof run.timestamp === "number"
      ? new Date(run.timestamp * 1000)
      : new Date();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Run Summary
            </div>
            <div className="mt-1 text-lg font-semibold text-zinc-900">
              {run.character} A{run.ascensionLevel}
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              {date.toLocaleString()} &middot; Score {run.score}
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-semibold text-zinc-700">
              Floor reached: {run.floorReached}
            </div>
            <div className="mt-1 text-zinc-600">
              {run.victory
                ? "Victory"
                : run.killedBy
                  ? `Killed by ${run.killedBy}`
                  : "Defeat"}
            </div>
          </div>
        </div>
      </section>

      {/* Final Deck + Relics + Removed Cards — items-start prevents height equalisation */}
      <section className="grid items-start gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">Final Deck</h2>
            {deck.length > 0 && (
              <div className="text-[11px] text-zinc-600">
                Deck size: <span className="font-semibold">{deck.length}</span>{" "}
                cards
              </div>
            )}
          </div>
          {deck.length === 0 ? (
            <p className="text-xs text-zinc-500">No deck data found.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
              {deck.map((card, index) => (
                <li
                  key={`${card.name}-${card.upgraded ? "u" : "n"}-${index}`}
                  className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-2 py-1"
                >
                  <span
                    className={`${
                      card.isAdded
                        ? "font-semibold text-emerald-700"
                        : card.upgraded
                          ? "font-semibold text-sky-700"
                          : "text-zinc-800"
                    }`}
                  >
                    {card.name}
                    {card.upgraded && (
                      <span className="ml-1 text-[10px] font-semibold uppercase">
                        +
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {deck.length > 0 && (
            <p className="mt-3 text-[11px] text-zinc-500">
              <span className="font-semibold text-emerald-700">Green</span>: added
              cards ·{" "}
              <span className="font-semibold text-sky-700">Blue</span>: starting
              cards upgraded via smith/event ·{" "}
              <span className="font-semibold text-zinc-800">Black</span>: starting
              deck
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">Relics</h2>
            {relics.length === 0 ? (
              <p className="text-xs text-zinc-500">No relics found.</p>
            ) : (
              <ul className="flex flex-wrap gap-1 text-xs">
                {relics.map((relic) => (
                  <li
                    key={relic}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-800"
                  >
                    {relic}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Removed Cards
            </h2>
            {removedCards.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No cards were permanently removed in this run.
              </p>
            ) : (
              <ul className="space-y-1 text-xs">
                {removedCards.map((entry, index) => (
                  <li
                    key={`${entry.name}-${index}`}
                    className="flex items-center justify-between rounded border border-red-100 bg-red-50 px-2 py-1 text-red-700"
                  >
                    <span className="font-medium">{entry.name}</span>
                    <span className="text-[11px]">
                      Floor {entry.floor ?? "?"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Card Decisions + Path Overview — items-start prevents height equalisation */}
      <section className="grid items-start gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Card Decisions
          </h2>
          <ScrollableTable
            columns={[
              { label: "Floor" },
              { label: "Picked" },
              { label: "Skipped" },
            ]}
            emptyMessage="No card choice data available."
            rows={decisions.map((row, index) => [
              <span key={index} className="text-zinc-700">{row.floor ?? "—"}</span>,
              <span className="text-zinc-800">{row.picked ?? "—"}</span>,
              <span className="text-zinc-700">
                {row.skipped.length > 0 ? row.skipped.join(", ") : "—"}
              </span>,
            ])}
          />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Path Overview
          </h2>
          {path.length === 0 ? (
            <p className="text-xs text-zinc-500">No path data available.</p>
          ) : (
            <ScrollableTable
              columns={[
                { label: "Floor" },
                { label: "Path" },
                { label: "Gold", align: "right" },
              ]}
              rows={path.map((step) => {
                const goldForFloor = goldPoints.find((p) => p.floor === step.floor);
                const shopVisit = step.symbol === "$"
                  ? shopInfo.visits.find((v) => v.floor === step.floor)
                  : undefined;
                const shopItems = shopVisit
                  ? [...shopVisit.cards, ...shopVisit.relics]
                  : [];
                const label = SYMBOL_LABEL[step.symbol] ?? step.symbol;
                return [
                  <span className="text-zinc-700">{step.floor}</span>,
                  <span className="text-zinc-800">
                    <span>{label}</span>
                    {step.detail && (
                      <span className="ml-2 text-[11px] text-zinc-600">
                        {step.symbol === "R" ? `(${step.detail})` : step.detail}
                      </span>
                    )}
                    {shopItems.length > 0 && (
                      <span className="ml-2 text-[11px] text-zinc-600">
                        ({shopItems.join(", ")})
                      </span>
                    )}
                  </span>,
                  <span className="text-zinc-500">
                    {goldForFloor ? `${goldForFloor.gold}g` : "—"}
                  </span>,
                ];
              })}
            />
          )}
        </div>
      </section>
    </div>
  );
}
