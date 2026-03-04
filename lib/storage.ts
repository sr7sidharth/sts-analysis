import type { Run } from "@/types/run";

const STORAGE_KEY = "sts_runs";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadRuns(): Run[] {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const valid = parsed.filter(
      (item): item is Run =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.sourcePlayId === "string" &&
        typeof item.character === "string" &&
        typeof item.ascensionLevel === "number" &&
        typeof item.floorReached === "number" &&
        typeof item.victory === "boolean" &&
        typeof item.score === "number" &&
        typeof item.timestamp === "number",
    );

    // Rehydrate fields that may be missing from runs stored before a schema change.
    return valid.map((run) => ({
      ...run,
      game: run.game ?? "STS1",
    }));
  } catch {
    return [];
  }
}

export function saveRuns(runs: Run[]): void {
  if (!isBrowser()) return;

  try {
    const payload = JSON.stringify(runs);
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Swallow localStorage errors; storage is best-effort only.
  }
}

export function addRunsDeduped(
  existing: Run[],
  incoming: Run[],
): { merged: Run[]; added: Run[] } {
  const byPlayId = new Map<string, Run>();

  for (const run of existing) {
    byPlayId.set(run.sourcePlayId, run);
  }

  const added: Run[] = [];

  for (const run of incoming) {
    if (!byPlayId.has(run.sourcePlayId)) {
      byPlayId.set(run.sourcePlayId, run);
      added.push(run);
    }
  }

  const merged = Array.from(byPlayId.values());
  return { merged, added };
}

