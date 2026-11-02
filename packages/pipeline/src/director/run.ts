import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { BetaContentBlockParam, BetaMessage, BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import {
  DirectorOutputSchema,
  buildRepairPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  checkDirectorOutput,
  toVideoSpecs,
  type BrandKit,
  type DirectorOutput,
  type Interview,
  type SpecIssue,
  type VideoSpec,
} from "@axxen/core";
import { claudeCost, type CostLedger } from "../costs";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface DirectorRequest {
  model: string;
  effort: Effort;
  system: string;
  messages: BetaMessageParam[];
}

/** One model call. Injected so tests (and the Haiku preview) can swap it. */
export type CreateMessage = (req: DirectorRequest) => Promise<BetaMessage>;

/**
 * Real Claude call: structured JSON output, cached system prompt, and server-side
 * refusal fallback ("default" picks Anthropic's recommended model per refusal category).
 */
export function anthropicCreateMessage(client: Anthropic = new Anthropic()): CreateMessage {
  const format = zodOutputFormat(DirectorOutputSchema);
  return (req) =>
    client.beta.messages
      .stream({
        model: req.model,
        max_tokens: 32000,
        system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
        messages: req.messages,
        output_config: { effort: req.effort, format },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      })
      .finalMessage();
}

export class DirectorError extends Error {
  constructor(
    readonly reason: "refusal" | "max_tokens" | "invalid",
    message: string,
    readonly issues: SpecIssue[] = [],
  ) {
    super(message);
  }
}

export interface DirectorResult {
  output: DirectorOutput;
  /** Base specs: minimum durations, no audio, no backgrounds. */
  specs: VideoSpec[];
  attempts: number;
}

export interface RunDirectorOptions {
  brand: BrandKit;
  interview: Interview;
  packId: string;
  createMessage?: CreateMessage;
  model?: string;
  effort?: Effort;
  /** Extra rounds where the model fixes rule violations. */
  maxRepairs?: number;
  ledger?: CostLedger;
  log?: (msg: string) => void;
}

function readOutput(msg: BetaMessage, brand: BrandKit, packId: string): { output?: DirectorOutput; issues: SpecIssue[] } {
  const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { issues: [{ specId: "respuesta", message: "no es JSON válido" }] };
  }
  const parsed = DirectorOutputSchema.safeParse(json);
  if (!parsed.success) {
    return {
      issues: parsed.error.issues.map((i) => ({ specId: i.path.slice(0, 2).join("."), message: `${i.path.join(".")}: ${i.message}` })),
    };
  }
  return { output: parsed.data, issues: checkDirectorOutput(parsed.data, brand, packId) };
}

/**
 * Brief + 5 scripts from the business data. Rule violations (invented prices, scenes
 * that do not fit, duplicated hooks...) go back to the model as a repair turn, keeping
 * the full previous response (thinking included) in the conversation.
 */
export async function runDirector(opts: RunDirectorOptions): Promise<DirectorResult> {
  const {
    brand,
    interview,
    packId,
    createMessage = anthropicCreateMessage(),
    model = "claude-opus-5-5",
    effort = "medium",
    maxRepairs = 2,
    ledger,
    log = () => {},
  } = opts;
  const system = buildSystemPrompt(brand.rubro);
  const messages: BetaMessageParam[] = [{ role: "user", content: buildUserPrompt(brand, interview) }];

  for (let attempt = 0; ; attempt++) {
    const started = Date.now();
    const msg = await createMessage({ model, effort, system, messages });
    const usd = claudeCost(msg.model, msg.usage);
    ledger?.add({
      step: "director",
      provider: msg.model,
      detail: `intento ${attempt + 1}: ${msg.usage.input_tokens} in / ${msg.usage.output_tokens} out / ${msg.usage.cache_read_input_tokens ?? 0} cache`,
      usd,
    });
    log(`director intento ${attempt + 1}: ${((Date.now() - started) / 1000).toFixed(1)}s, US$ ${usd.toFixed(3)}, stop=${msg.stop_reason}`);

    if (msg.stop_reason === "refusal") throw new DirectorError("refusal", "el modelo rechazó el pedido");
    if (msg.stop_reason === "max_tokens") throw new DirectorError("max_tokens", "la respuesta se cortó por longitud");

    const { output, issues } = readOutput(msg, brand, packId);
    if (output && issues.length === 0) return { output, specs: toVideoSpecs(output, packId), attempts: attempt + 1 };
    for (const i of issues) log(`  ✗ [${i.specId}] ${i.message}`);
    if (attempt >= maxRepairs) {
      throw new DirectorError("invalid", `el guion sigue con ${issues.length} problema(s) después de ${attempt + 1} intentos`, issues);
    }
    messages.push({ role: "assistant", content: msg.content as BetaContentBlockParam[] });
    messages.push({ role: "user", content: buildRepairPrompt(issues) });
  }
}
