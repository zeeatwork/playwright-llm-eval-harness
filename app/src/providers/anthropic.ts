import Anthropic from "@anthropic-ai/sdk";
import type { BotReply, ChatTurn, LlmProvider } from "./types.js";

export class AnthropicProvider implements LlmProvider {
  name = "anthropic";
  private client = new Anthropic();
  constructor(private model = process.env.BOT_MODEL ?? "claude-opus-5-5") {}

  async complete(system: string, history: ChatTurn[]): Promise<BotReply> {
    const response = await this.client.beta.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: history,
      // Chat is latency-sensitive and simple; low effort keeps it fast and cheap.
      output_config: { effort: "low" },
      // If a safety classifier declines, re-run on Anthropic's recommended fallback model server-side.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return { text, model: response.model, stopReason: response.stop_reason };
  }
}
