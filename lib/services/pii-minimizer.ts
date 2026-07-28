type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const patterns: Array<{ category: string; expression: RegExp }> = [
  { category: "E-MAIL", expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
  { category: "IBAN", expression: /\bDE(?:[\s-]?\d){20}\b/giu },
  {
    category: "TELEFON",
    expression: /(?<!\d)(?:(?:\+49|0049)[\s/()-]*(?:\d[\s/()-]*){7,14}|01[5-7]\d{8,9}|0[2-9]\d{8,11}|0\d{2,4}[\s/()-]+(?:\d[\s/()-]*){5,12})(?!\d)/gu,
  },
  {
    category: "ANSCHRIFT",
    expression: /\b[\p{L}][\p{L}.' -]{1,50}(?:straße|strasse|str\.|weg|allee|platz|gasse|ring)\s+\d{1,5}\s*[a-z]?\b/giu,
  },
  {
    category: "PERSON",
    expression: /\b(?:Herrn?|Frau|Dr\.|Prof\.)\s+(?:[\p{Lu}][\p{L}'-]+\s*){1,3}\b/gu,
  },
  {
    category: "REFERENZ",
    expression: /\b(?:Kunden|Vertrags|Buchungs|Bestell|Vorgangs|Akten|Rechnungs)(?:nummer|nr\.?|zeichen)\s*[:#-]?\s*[A-Z0-9][A-Z0-9./_-]{3,}\b/giu,
  },
];

export class PiiMinimizer {
  private readonly replacements = new Map<string, string>();
  private readonly counters = new Map<string, number>();

  private token(category: string, value: string) {
    const normalized = value.trim().toLocaleLowerCase("de-DE");
    const key = `${category}:${normalized}`;
    const known = this.replacements.get(key);
    if (known) return known;
    const next = (this.counters.get(category) || 0) + 1;
    this.counters.set(category, next);
    const replacement = `[${category}_${next}]`;
    this.replacements.set(key, replacement);
    return replacement;
  }

  text(value: string) {
    return patterns.reduce(
      (current, pattern) => current.replace(pattern.expression, match => this.token(pattern.category, match)),
      value,
    );
  }

  party(value: string) {
    return value.trim() ? this.token("GEGENSEITE", value) : "";
  }

  value(value: JsonValue): JsonValue {
    if (typeof value === "string") return this.text(value);
    if (Array.isArray(value)) return value.map(item => this.value(item));
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        key === "parties" && Array.isArray(item)
          ? item.map(party => typeof party === "string" ? this.token("PARTEI", party) : this.value(party))
          : this.value(item),
      ]));
    }
    return value;
  }
}

export function minimizeCaseInput<T extends {
  opposingParty?: string;
  topic?: string;
  description?: string;
  desiredOutcome?: string;
  answers: Array<{ key: string; prompt: string; answer: string }>;
  documents: Array<Record<string, unknown>>;
}>(input: T): T {
  const minimizer = new PiiMinimizer();
  return {
    ...input,
    opposingParty: input.opposingParty ? minimizer.party(input.opposingParty) : input.opposingParty,
    topic: input.topic ? minimizer.text(input.topic) : input.topic,
    description: input.description ? minimizer.text(input.description) : input.description,
    desiredOutcome: input.desiredOutcome ? minimizer.text(input.desiredOutcome) : input.desiredOutcome,
    answers: input.answers.map(answer => ({
      ...answer,
      prompt: minimizer.text(answer.prompt),
      answer: minimizer.text(answer.answer),
    })),
    documents: input.documents.map(document =>
      minimizer.value(document as JsonValue) as Record<string, unknown>),
  };
}
