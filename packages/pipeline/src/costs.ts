/**
 * Cost ledger: every paid call records what it cost, so each order has a real COGS.
 * Prices are list prices (USD) as of 2026-10; check them when they change.
 */
export const PRICES = {
  claude: {
    // per 1M tokens: input, output, cache write (5 min), cache read
    "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
    "claude-opus-5": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
    "claude-opus-4-8": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
    "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
    "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
  } as Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }>,
  /** Azure neural TTS, per 1M characters (free tier: 0.5M chars/month). */
  azureTtsPerMChars: 15,
} as const;

export interface CostEntry {
  step: string;
  provider: string;
  detail: string;
  usd: number;
}

export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export function claudeCost(model: string, u: ClaudeUsage): number {
  const p = PRICES.claude[model] ?? PRICES.claude["claude-opus-5-5"]!;
  return (
    (u.input_tokens * p.input +
      u.output_tokens * p.output +
      (u.cache_creation_input_tokens ?? 0) * p.cacheWrite +
      (u.cache_read_input_tokens ?? 0) * p.cacheRead) /
    1_000_000
  );
}

export class CostLedger {
  readonly entries: CostEntry[] = [];
  add(entry: CostEntry): void {
    this.entries.push(entry);
  }
  get totalUsd(): number {
    return this.entries.reduce((s, e) => s + e.usd, 0);
  }
  byStep(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const e of this.entries) out[e.step] = (out[e.step] ?? 0) + e.usd;
    return out;
  }
  toJSON() {
    return { totalUsd: Number(this.totalUsd.toFixed(4)), byStep: this.byStep(), entries: this.entries };
  }
}
