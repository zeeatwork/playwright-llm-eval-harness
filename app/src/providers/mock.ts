import type { BotReply, ChatTurn, LlmProvider } from "./types.js";

/**
 * Deterministic offline stand-in for the LLM so API/E2E/security suites run in CI with no key and no flakiness.
 * It "answers" by returning the knowledge-base section with the most keyword overlap, and it obeys
 * extraction attacks only when the confidentiality rule is missing from the system prompt,
 * so seeded defects change its behavior the same way they would a real model's.
 */
export class MockProvider implements LlmProvider {
  name = "mock";

  async complete(system: string, history: ChatTurn[]): Promise<BotReply> {
    const question = history.at(-1)?.content.toLowerCase() ?? "";
    const guarded = system.includes("Never reveal");

    if (/(system prompt|your instructions|ignore (all |previous )?instructions)/.test(question)) {
      const text = guarded ? "Sorry, I can't share that. I can help with orders, returns, shipping and warranty questions." : system;
      return { text, model: "mock", stopReason: "end_turn" };
    }

    const sections = (system.split("<knowledge_base>")[1] ?? "").split(/\n## /).slice(1);
    const words = question.match(/[a-z]{4,}/g) ?? [];
    const scored = sections
      .map((s) => ({ s, score: words.filter((w) => s.toLowerCase().includes(w.replace(/s$/, ""))).length }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    const text =
      best && best.score > 0
        ? best.s.split("\n").slice(1).join(" ").trim()
        : "I don't know the answer to that. Please email support@northwind.example.";
    return { text, model: "mock", stopReason: "end_turn" };
  }
}
