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

function validateSts1Fields(raw: any): void {
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

function validateSts2Fields(raw: any): void {
  const hasPlayersArray = Array.isArray(raw?.players) && raw.players.length > 0;
  if (!hasPlayersArray) {
    throw new RunParseError("STS2 run is missing a non-empty 'players' array.");
  }

  const primaryPlayer = raw.players[0];

  if (typeof raw.ascension !== "number") {
    throw new RunParseError("STS2 field 'ascension' must be a number.");
  }

  if (typeof raw.win !== "boolean") {
    throw new RunParseError("STS2 field 'win' must be a boolean.");
  }

  if (typeof raw.start_time !== "number") {
    throw new RunParseError("STS2 field 'start_time' must be a number.");
  }

  if (typeof primaryPlayer.character !== "string") {
    throw new RunParseError("STS2 field 'players[0].character' must be a string.");
  }

  if (!Array.isArray(primaryPlayer.deck)) {
    throw new RunParseError("STS2 field 'players[0].deck' must be an array.");
  }
}

function validateMinimalFields(raw: any): void {
  const game = detectGame(raw);
  if (game === "STS1") {
    validateSts1Fields(raw);
    return;
  }
  if (game === "STS2") {
    validateSts2Fields(raw);
    return;
  }
  throw new RunParseError("Unrecognized run format: not STS1 or STS2.");
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Tiny fallback UUID-ish generator; good enough for local-only IDs.
  return "run-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isSts1Raw(raw: any): boolean {
  const hasCoreFields =
    typeof raw?.character_chosen === "string" &&
    typeof raw?.floor_reached === "number" &&
    typeof raw?.ascension_level === "number";

  const hasSts1Arrays =
    Array.isArray(raw?.path_per_floor) ||
    Array.isArray(raw?.campfire_choices) ||
    Array.isArray(raw?.damage_taken);

  return hasCoreFields || hasSts1Arrays;
}

function isSts2Raw(raw: any): boolean {
  const hasPlayers =
    Array.isArray(raw?.players) &&
    raw.players.length > 0 &&
    typeof raw.players[0]?.character === "string";

  const hasAscension = typeof raw?.ascension === "number";
  const hasMapPointHistory = Array.isArray(raw?.map_point_history);
  const hasSchemaVersion = typeof raw?.schema_version === "number";

  return hasPlayers && hasAscension && (hasMapPointHistory || hasSchemaVersion);
}

function detectGame(raw: any): GameId {
  if (isSts1Raw(raw)) {
    return "STS1";
  }
  if (isSts2Raw(raw)) {
    return "STS2";
  }
  return "unknown";
}

function normalizeSts1Run(raw: any): Run {
  const timestamp =
    typeof raw.timestamp === "number"
      ? raw.timestamp
      : Math.floor(Date.now() / 1000);

  const victory =
    typeof raw.victory === "boolean"
      ? raw.victory
      : raw.floor_reached >= 50 || false;

  const isDaily = raw.is_daily === true;
  const dailyMods: string[] =
    isDaily && Array.isArray(raw.daily_mods)
      ? raw.daily_mods.filter(
          (m: unknown): m is string => typeof m === "string",
        )
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
    game: "STS1",
    isDaily,
    dailyMods,
    raw,
  };

  return run;
}

function mapSts2Character(id: string): string {
  // Raw IDs look like "CHARACTER.SILENT". Use the part after the dot.
  const parts = id.split(".");
  const base = parts[parts.length - 1] ?? id;
  // Title-case the name for display.
  const lower = base.toLowerCase();
  const pretty = lower.charAt(0).toUpperCase() + lower.slice(1);
  return pretty;
}

function deriveSts2FloorReached(raw: any): number {
  // Approximate floor reached from map_point_history.
  const history: unknown = raw?.map_point_history;
  if (!Array.isArray(history)) return 0;
  let maxFloors = 0;
  for (const act of history) {
    if (Array.isArray(act)) {
      maxFloors += act.length;
    }
  }
  return maxFloors;
}

function normalizeSts2Run(raw: any): Run {
  const primaryPlayer = raw.players[0];

  const timestamp =
    typeof raw.start_time === "number"
      ? raw.start_time
      : Math.floor(Date.now() / 1000);

  const victory = raw.win === true;

  const killedByEncounter =
    typeof raw.killed_by_encounter === "string" &&
    raw.killed_by_encounter !== "NONE.NONE"
      ? raw.killed_by_encounter
      : undefined;

  const killedByEvent =
    typeof raw.killed_by_event === "string" &&
    raw.killed_by_event !== "NONE.NONE"
      ? raw.killed_by_event
      : undefined;

  const killedBy = victory ? undefined : killedByEncounter ?? killedByEvent;

  const isDaily = raw.game_mode === "daily";
  const dailyMods: string[] = Array.isArray(raw.modifiers)
    ? raw.modifiers.filter((m: unknown): m is string => typeof m === "string")
    : [];

  const floorReached = deriveSts2FloorReached(raw);

  const seedPart =
    typeof raw.seed === "string" ? raw.seed : "unknown-seed";
  const sourcePlayId = `STS2:${timestamp}:${seedPart}`;

  const run: Run = {
    id: generateId(),
    sourcePlayId,
    character: mapSts2Character(primaryPlayer.character),
    ascensionLevel: typeof raw.ascension === "number" ? raw.ascension : 0,
    floorReached,
    victory,
    killedBy,
    score: 0,
    timestamp,
    game: "STS2",
    isDaily,
    dailyMods,
    raw,
  };

  return run;
}

export function normalizeRun(raw: any): Run {
  validateMinimalFields(raw);
  const game = detectGame(raw);
  if (game === "STS1") {
    return normalizeSts1Run(raw);
  }
  if (game === "STS2") {
    return normalizeSts2Run(raw);
  }
  throw new RunParseError("Unsupported run format; only STS1 and STS2 are handled.");
}


