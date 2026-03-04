"use client";

import type { ReactNode } from "react";

export type ColumnDef = {
  label: string;
  align?: "left" | "right";
  onClick?: () => void;
  sortIndicator?: "asc" | "desc" | null;
};

type ScrollableTableProps = {
  columns: ColumnDef[];
  rows: ReactNode[][];
  minRows?: number;
  emptyMessage?: string;
};

export function ScrollableTable({
  columns,
  rows,
  minRows = 20,
  emptyMessage = "No data.",
}: ScrollableTableProps) {
  const displayRows = rows.length >= minRows ? rows : [
    ...rows,
    ...Array.from({ length: minRows - rows.length }, () => null),
  ];

  return (
    <div className="h-64 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-3 py-2 ${col.align === "right" ? "text-right" : "text-left"} ${col.onClick ? "cursor-pointer select-none hover:text-zinc-700" : ""}`}
                onClick={col.onClick}
              >
                {col.label}
                {col.sortIndicator === "asc" && " ↑"}
                {col.sortIndicator === "desc" && " ↓"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-3 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            displayRows.map((row, rowIndex) =>
              row === null ? (
                <tr
                  key={`empty-${rowIndex}`}
                  className="border-t border-zinc-100 even:bg-zinc-50/60"
                >
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-3 py-1.5">
                      {colIndex === 0 ? "\u00a0" : ""}
                    </td>
                  ))}
                </tr>
              ) : (
                <tr
                  key={rowIndex}
                  className="border-t border-zinc-100 even:bg-zinc-50/60"
                >
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-3 py-1.5 ${columns[colIndex]?.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              )
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
