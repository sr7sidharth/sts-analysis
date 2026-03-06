"use client";

import { useState } from "react";
import type { Run } from "@/types/run";
import {
  getCardDecisionContext,
  getCardDecisionRows,
  getFinalDeck,
  getPathOverview,
  getRelicsForRun,
  getRelicsWithFloors,
  getRemovedCardsWithFloors,
  getShopVisitsForRun,
  getGoldPerFloor,
} from "@/lib/analytics";
import { ScrollableTable } from "@/components/ScrollableTable";
import { formatIdLabel } from "@/lib/labels";

function ContextModal({
  run,
  floor,
  playerIndex,
  onClose,
}: {
  run: Run;
  floor: number;
  playerIndex: number;
  onClose: () => void;
}) {
  const context = getCardDecisionContext(run, floor, playerIndex);
  if (!context) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={0}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">
            Context at floor {floor}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            ×
          </button>
        </div>
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-semibold text-zinc-600">Gold</div>
            <div className="text-zinc-800">{context.gold}</div>
          </div>
          <div>
            <div className="font-semibold text-zinc-600">Relics</div>
            <div className="flex flex-wrap gap-1 text-zinc-800">
              {context.relics.length === 0 ? (
                <span className="text-zinc-500">None</span>
              ) : (
                context.relics.map((r, i) => (
                  <span
                    key={`${r}-${i}`}
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5"
                  >
                    {formatIdLabel(r)}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="font-semibold text-zinc-600">Deck</div>
            <div className="flex flex-wrap gap-1 text-zinc-800">
              {context.deck.length === 0 ? (
                <span className="text-zinc-500">Empty</span>
              ) : (
                context.deck.map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5"
                  >
                    {formatIdLabel(c)}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="font-semibold text-zinc-600">Potions</div>
            <div className="flex flex-wrap gap-1 text-zinc-800">
              {context.potions.length === 0 ? (
                <span className="text-zinc-500">None</span>
              ) : (
                context.potions.map((p, i) => (
                  <span
                    key={`${p}-${i}`}
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5"
                  >
                    {formatIdLabel(p)}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const raw = run.raw as { players?: { character?: string }[] } | undefined;
  const players = Array.isArray(raw?.players) ? raw.players : [];
  const hasMultiplePlayers = run.game === "STS2" && players.length > 1;

  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [contextModalFloor, setContextModalFloor] = useState<number | null>(null);
  const effectivePlayerIndex = hasMultiplePlayers ? selectedPlayerIndex : 0;

  const deck = getFinalDeck(run, effectivePlayerIndex);
  const relics = getRelicsForRun(run, effectivePlayerIndex);
  const relicsWithFloors = getRelicsWithFloors(run, effectivePlayerIndex);
  const decisions = getCardDecisionRows(run);
  const path = getPathOverview(run);
  const removedCardsWithFloors = getRemovedCardsWithFloors(run, effectivePlayerIndex);
  const shopVisits = getShopVisitsForRun(run, effectivePlayerIndex);
  const goldPoints = getGoldPerFloor(run, effectivePlayerIndex);

  const date =
    typeof run.timestamp === "number"
      ? new Date(run.timestamp * 1000)
      : new Date();

  // Simple potion usage summary for STS2: count all potion_used entries in map_point_history.
  let potionsUsed: number | null = null;
  if (run.game === "STS2") {
    const raw: any = run.raw;
    if (Array.isArray(raw?.map_point_history)) {
      let count = 0;
      for (const act of raw.map_point_history) {
        if (!Array.isArray(act)) continue;
        for (const point of act) {
          if (!point || typeof point !== "object") continue;
          const statsArr: unknown = (point as any).player_stats;
          if (!Array.isArray(statsArr)) continue;
          for (const stats of statsArr) {
            if (!stats || typeof stats !== "object") continue;
            const used: unknown = (stats as any).potion_used;
            if (Array.isArray(used)) {
              count += used.length;
            }
          }
        }
      }
      potionsUsed = count;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
        {run.isDaily && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
              Daily Challenge
            </span>
            {run.dailyMods.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {run.dailyMods.map((mod) => (
                  <span
                    key={mod}
                    className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-800"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-amber-700">No modifiers</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Run Summary
            </div>
            {hasMultiplePlayers && (
              <div className="mb-2">
                <label className="mr-2 text-[11px] font-semibold text-zinc-600">
                  Character:
                </label>
                <select
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
                  value={selectedPlayerIndex}
                  onChange={(e) =>
                    setSelectedPlayerIndex(Number(e.target.value))
                  }
                >
                  {players.map((p, i) => (
                    <option key={i} value={i}>
                      {formatIdLabel(p?.character ?? `Player ${i + 1}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-1 text-lg font-semibold text-zinc-900">
              {hasMultiplePlayers
                ? formatIdLabel(players[effectivePlayerIndex]?.character ?? run.character)
                : run.character}{" "}
              {run.isDaily ? (
                <span className="text-base font-normal text-zinc-500">Daily</span>
              ) : (
                `A${run.ascensionLevel}`
              )}
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
                  ? `Killed by ${formatIdLabel(run.killedBy)}`
                  : "Defeat"}
            </div>
            {potionsUsed != null && (
              <div className="mt-1 text-zinc-600">
                Potions used: {potionsUsed}
              </div>
            )}
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
                    {formatIdLabel(card.name.replace(/\+.*/, ""))}
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
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">Relics</h2>
              {relicsWithFloors.length > 0 && (
                <span className="text-[11px] text-zinc-600">
                  {relicsWithFloors.length} total
                </span>
              )}
            </div>
            {relicsWithFloors.length === 0 ? (
              <p className="text-xs text-zinc-500">No relics found.</p>
            ) : (
              <ul className="flex flex-wrap gap-1 text-xs">
                {relicsWithFloors.map((item, i) => (
                  <li
                    key={`${item.id}-${i}`}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-800"
                  >
                    {formatIdLabel(item.id)}
                    {item.floor != null && (
                      <span className="ml-1 text-zinc-500">
                        (floor {item.floor})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Removed Cards
              </h2>
              {removedCardsWithFloors.length > 0 && (
                <span className="text-[11px] text-zinc-600">
                  {removedCardsWithFloors.length} removed
                </span>
              )}
            </div>
            {removedCardsWithFloors.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No cards were permanently removed in this run.
              </p>
            ) : (
              <ul className="space-y-1 text-xs">
                {removedCardsWithFloors.map((item, index) => (
                  <li
                    key={`${item.id}-${index}`}
                    className="rounded border border-red-100 bg-red-50 px-2 py-1 text-red-700"
                  >
                    <span className="font-medium">{formatIdLabel(item.id)}</span>
                    {item.floor != null && (
                      <span className="ml-1 text-red-600">
                        (removed floor {item.floor})
                      </span>
                    )}
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
              { label: "Context" },
            ]}
            emptyMessage="No card choice data available."
            rows={decisions.map((row, index) => {
              const floor = row.floor;
              const hasContext =
                typeof floor === "number" &&
                getCardDecisionContext(run, floor, effectivePlayerIndex) != null;
              return [
                <span key={index} className="text-zinc-700">{row.floor ?? "—"}</span>,
                <span className="text-zinc-800">
                  {row.picked ? formatIdLabel(row.picked) : "—"}
                </span>,
                <span className="text-zinc-700">
                  {row.skipped.length > 0
                    ? row.skipped.map((name) => formatIdLabel(name)).join(", ")
                    : "—"}
                </span>,
                hasContext ? (
                  <button
                    type="button"
                    onClick={() => setContextModalFloor(floor)}
                    className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
                  >
                    View
                  </button>
                ) : (
                  <span className="text-zinc-400">—</span>
                ),
              ];
            })}
          />
          {contextModalFloor != null && (
            <ContextModal
              run={run}
              floor={contextModalFloor}
              playerIndex={effectivePlayerIndex}
              onClose={() => setContextModalFloor(null)}
            />
          )}
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
                  ? shopVisits.find((v) => v.floor === step.floor)
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
                          {step.symbol === "R"
                            ? `(${formatIdLabel(step.detail)})`
                            : formatIdLabel(step.detail)}
                      </span>
                    )}
                    {shopItems.length > 0 && (
                      <span className="ml-2 text-[11px] text-zinc-600">
                          (
                          {shopItems
                            .map((item) => formatIdLabel(item))
                            .join(", ")}
                          )
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
