function stripNamespace(id: string): string {
  if (typeof id !== "string") return id as unknown as string;

  const prefixes = [
    "CARD.",
    "RELIC.",
    "ENCOUNTER.",
    "EVENT.",
    "MONSTER.",
    "CHARACTER.",
    "POTION.",
  ];

  for (const prefix of prefixes) {
    if (id.startsWith(prefix)) {
      return id.slice(prefix.length);
    }
  }

  return id;
}

function toTitleCaseFromId(base: string): string {
  if (!base) return base;

  const normalized = base.replace(/\./g, "_");
  const parts = normalized.split(/[_\s]+/).filter(Boolean);
  if (parts.length === 0) return base;

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatIdLabel(id: string): string {
  if (typeof id !== "string") return id as unknown as string;
  const stripped = stripNamespace(id);
  return toTitleCaseFromId(stripped);
}

