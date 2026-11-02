import type { BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import {
  BrandKitSchema,
  DirectorOutputSchema,
  InterviewSchema,
  TEXT_LIMITS,
  buildSystemPrompt,
  buildUserPrompt,
  checkDirectorOutput,
} from "@axxen/core";
import { VIDEO_PUBLIC_DIR } from "@axxen/video/paths";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CostLedger, DirectorError, runDirector, type DirectorRequest } from "../src";

const dir = join(VIDEO_PUBLIC_DIR, "fixtures/hamburgueseria");
const brand = BrandKitSchema.parse(JSON.parse(readFileSync(join(dir, "brand.json"), "utf8")));
const interview = InterviewSchema.parse(JSON.parse(readFileSync(join(dir, "interview.json"), "utf8")));
const sample = DirectorOutputSchema.parse(JSON.parse(readFileSync(join(dir, "director-sample.json"), "utf8")));

const reply = (body: unknown, stop: BetaMessage["stop_reason"] = "end_turn"): BetaMessage =>
  ({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [{ type: "text", text: typeof body === "string" ? body : JSON.stringify(body) }],
    stop_reason: stop,
    usage: { input_tokens: 9000, output_tokens: 7000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  }) as unknown as BetaMessage;

describe("director prompt", () => {
  it("carries the rules, limits and hook bank, and keeps business data out of the system prompt", () => {
    const system = buildSystemPrompt("gastronomia");
    expect(system).toContain("voseo");
    expect(system).toContain(`≤${TEXT_LIMITS.punchLine} car.`);
    expect(system).toContain("¿Antojo de [producto] de verdad?");
    expect(system).not.toContain(brand.name);
    const user = buildUserPrompt(brand, interview);
    expect(user).toContain('"productId": "doble-cheddar"');
    expect(user).toContain("Explotar el delivery del finde");
  });

  it("accepts the sample output", () => {
    expect(checkDirectorOutput(sample, brand, "t")).toEqual([]);
  });
});

describe("runDirector", () => {
  it("sends violations back to the model and keeps the previous turn", async () => {
    const invented = structuredClone(sample);
    const price = invented.videos[4]!.scenes[1]!;
    if (price.type === "price_card") price.price = 9900;
    const calls: DirectorRequest[] = [];
    const responses = [reply(invented), reply(sample)];
    const ledger = new CostLedger();
    const result = await runDirector({
      brand,
      interview,
      packId: "t",
      ledger,
      createMessage: async (req) => {
        calls.push(structuredClone(req));
        return responses.shift()!;
      },
    });
    expect(result.attempts).toBe(2);
    expect(result.specs).toHaveLength(5);
    expect(calls[1]!.messages).toHaveLength(3);
    expect(calls[1]!.messages[1]!.role).toBe("assistant");
    expect(JSON.stringify(calls[1]!.messages[2]!.content)).toContain("price 9900");
    expect(ledger.entries).toHaveLength(2);
    expect(ledger.totalUsd).toBeCloseTo(2 * ((9000 * 4 + 7000 * 20) / 1e6), 6);
  });

  it("gives up after the repair budget", async () => {
    await expect(
      runDirector({ brand, interview, packId: "t", maxRepairs: 1, createMessage: async () => reply("no es json") }),
    ).rejects.toMatchObject({ reason: "invalid" });
  });

  it("stops on a refusal", async () => {
    const err = await runDirector({ brand, interview, packId: "t", createMessage: async () => reply("", "refusal") }).catch((e) => e);
    expect(err).toBeInstanceOf(DirectorError);
    expect(err.reason).toBe("refusal");
  });
});
