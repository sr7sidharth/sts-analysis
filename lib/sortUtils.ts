export type SortState<T extends string> = {
  column: T;
  direction: "asc" | "desc";
};

export function toggleSort<T extends string>(
  prev: SortState<T>,
  column: T,
): SortState<T> {
  return {
    column,
    direction: prev.column === column && prev.direction === "desc" ? "asc" : "desc",
  };
}

export function sortIndicator<T extends string>(
  sort: SortState<T>,
  column: T,
): "asc" | "desc" | null {
  return sort.column === column ? sort.direction : null;
}
