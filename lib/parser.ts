import type { GameId, Run } from "@/types/run";

export class RunParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunParseError";
  }
}

export function parseRunFileText(text: string): unknown {
  try {
    const raw = JSON.parse(text);
    if (raw === null || typeof raw !== "object") {
      throw new RunParseError("Run file must contain a JSON object.");
    }
    return raw;
  } catch (error) {
    if (error instanceof RunParseError) {
      throw error;
    }
    throw new RunParseError("Failed to parse JSON from run file.");
  }
}

function validateMinimalFields(raw: any): void {
  const requiredObjectFields: Array<keyof any> = [
    "character_chosen",
    "floor_reached",
    "ascension_level",
    "card_choices",
    "relics",
    "play_id",
  ];

  for (const field of requiredObjectFields) {
    if (!(field in raw)) {
      throw new RunParseError(`Missing required field '${String(field)}'.`);
    }
  }

  if (typeof raw.character_chosen !== "string") {
    throw new RunParseError("Field 'character_chosen' must be a string.");
  }

  if (typeof raw.floor_reached !== "number") {
    throw new RunParseError("Field 'floor_reached' must be a number.");
  }

  if (typeof raw.ascension_level !== "number") {
    throw new RunParseError("Field 'ascension_level' must be a number.");
  }

  if (!Array.isArray(raw.card_choices)) {
    throw new RunParseError("Field 'card_choices' must be an array.");
  }

  if (!Array.isArray(raw.relics)) {
    throw new RunParseError("Field 'relics' must be an array.");
  }

  if (typeof raw.play_id !== "string") {
    throw new RunParseError("Field 'play_id' must be a string.");
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Tiny fallback UUID-ish generator; good enough for local-only IDs.
  return "run-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function detectGame(raw: any): GameId {
  // Best-effort heuristic for now: STS1 logs are the only known format.
  // When STS2 format is documented, extend this to look for STS2-specific keys.
  const hasSts1Keys =
    Array.isArray(raw?.path_per_floor) ||
    Array.isArray(raw?.campfire_choices) ||
    Array.isArray(raw?.damage_taken);

  if (hasSts1Keys) {
    return "STS1";
  }

  // Placeholder for future STS2 detection.
  const hasSts2Keys = false;
  if (hasSts2Keys) {
    return "STS2";
  }

  return "unknown";
}

export function normalizeRun(raw: any): Run {
  validateMinimalFields(raw);

  const timestamp =
    typeof raw.timestamp === "number"
      ? raw.timestamp
      : Math.floor(Date.now() / 1000);

  const victory =
    typeof raw.victory === "boolean"
      ? raw.victory
      : raw.floor_reached >= 50 || false;

  const isDaily = raw.is_daily === true;
  const dailyMods: string[] = isDaily && Array.isArray(raw.daily_mods)
    ? raw.daily_mods.filter((m: unknown): m is string => typeof m === "string")
    : [];

  const run: Run = {
    id: generateId(),
    sourcePlayId: raw.play_id,
    character: raw.character_chosen,
    ascensionLevel: raw.ascension_level,
    floorReached: raw.floor_reached,
    victory,
    killedBy: typeof raw.killed_by === "string" ? raw.killed_by : undefined,
    score: typeof raw.score === "number" ? raw.score : 0,
    timestamp,
    game: detectGame(raw),
    isDaily,
    dailyMods,
    raw,
  };

  return run;
}

