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

      <section className="grid gap-6 md:grid-cols-2">
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
                  </span>
                  {card.upgraded && (
                    <span className="ml-2 text-[10px] font-semibold uppercase text-sky-700">
                      +
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {deck.length > 0 && (
            <p className="mt-3 text-[11px] text-zinc-500">
              <span className="font-semibold text-emerald-700">Green</span>: added
              cards ·{" "}
              <span className="font-semibold text-sky-700">Blue</span>: upgraded
              cards · <span className="font-semibold text-zinc-800">Black</span>:
              starting deck
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

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Card Decisions
          </h2>
          <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Floor</th>
                  <th className="px-3 py-2 text-left">Picked</th>
                  <th className="px-3 py-2 text-left">Skipped</th>
                </tr>
              </thead>
              <tbody>
                {decisions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-center text-zinc-500"
                    >
                      No card choice data available.
                    </td>
                  </tr>
                ) : (
                  <>
                    {decisions.map((row, index) => (
                      <tr
                        key={`${row.floor ?? "?"}-${row.picked ?? "none"}-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5 text-left text-zinc-700">
                          {row.floor ?? "—"}
                        </td>
                        <td className="px-3 py-1.5 text-left text-zinc-800">
                          {row.picked ?? "—"}
                        </td>
                        <td className="px-3 py-1.5 text-left text-zinc-700">
                          {row.skipped.length > 0
                            ? row.skipped.join(", ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 20 - decisions.length) }).map(
                      (_, index) => (
                        <tr
                          key={`empty-${index}`}
                          className="border-t border-zinc-100 even:bg-zinc-50/60"
                        >
                          <td className="px-3 py-1.5 text-left text-zinc-400">
                            —
                          </td>
                          <td className="px-3 py-1.5 text-left text-zinc-400">
                            —
                          </td>
                          <td className="px-3 py-1.5 text-left text-zinc-400">
                            —
                          </td>
                        </tr>
                      ),
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Path Overview
          </h2>
          {path.length === 0 ? (
            <p className="text-xs text-zinc-500">No path data available.</p>
          ) : (
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Floor</th>
                    <th className="px-3 py-2 text-left">Path</th>
                    <th className="px-3 py-2 text-right">Gold</th>
                  </tr>
                </thead>
                <tbody>
                  {path.map((step) => {
                    const goldForFloor = goldPoints.find(
                      (p) => p.floor === step.floor,
                    );
                    return (
                      <tr
                        key={step.floor}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5 text-left text-zinc-700">
                          {step.floor}
                        </td>
                        <td className="px-3 py-1.5 text-left text-zinc-800">
                          <span className="font-mono">{step.symbol}</span>
                          {step.detail && (
                            <span className="ml-2 text-[11px] text-zinc-600">
                              {step.symbol === "R" ? `(${step.detail})` : step.detail}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right text-zinc-500">
                          {goldForFloor ? `${goldForFloor.gold}g` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 20 - path.length) }).map(
                    (_, index) => (
                      <tr
                        key={`empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5 text-left text-zinc-400">
                          —
                        </td>
                        <td className="px-3 py-1.5 text-left text-zinc-400">
                          —
                        </td>
                        <td className="px-3 py-1.5 text-right text-zinc-400">
                          —
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Shop</h2>
          {shopInfo.visits.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No shop visits were recorded in this run.
            </p>
          ) : (
            <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Floor</th>
                    <th className="px-3 py-2 text-left">Cards</th>
                    <th className="px-3 py-2 text-left">Relics</th>
                  </tr>
                </thead>
                <tbody>
                  {shopInfo.visits.map((visit) => (
                    <tr
                      key={visit.floor}
                      className="border-t border-zinc-100 even:bg-zinc-50/60"
                    >
                      <td className="px-3 py-1.5 text-left text-zinc-700">
                        {visit.floor}
                      </td>
                      <td className="px-3 py-1.5 text-left text-zinc-800">
                        {visit.cards.length > 0 ? (
                          <span className="font-medium">
                            {visit.cards.join(", ")}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-left text-zinc-800">
                        {visit.relics.length > 0 ? (
                          <span className="font-medium">
                            {visit.relics.join(", ")}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 20 - shopInfo.visits.length) }).map(
                    (_, index) => (
                      <tr
                        key={`empty-${index}`}
                        className="border-t border-zinc-100 even:bg-zinc-50/60"
                      >
                        <td className="px-3 py-1.5 text-left text-zinc-400">
                          —
                        </td>
                        <td className="px-3 py-1.5 text-left text-zinc-400">
                          —
                        </td>
                        <td className="px-3 py-1.5 text-left text-zinc-400">
                          —
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

