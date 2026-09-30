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

    if (/(system prompt|initial prompt|your (instructions|rules|guidelines)|ignore (all |any |previous |prior |the )*(instructions|rules)|verbatim)/.test(question)) {
      const text = guarded ? "Sorry, I can't share that. I can help with orders, returns, shipping and warranty questions." : system;
      return { text, model: "mock", stopReason: "end_turn" };
    }

    // Only the text between the tags: without the closing split, the last section (Contact) would carry
    // "</knowledge_base>" into its answer and trip the security suite's prompt-leak canary.
    const kb = (system.split("<knowledge_base>")[1] ?? "").split("</knowledge_base>")[0] ?? "";
    const sections = kb.split(/\n## /).slice(1);
    const words = question.match(/[a-z]{4,}/g) ?? [];
    // Score = keyword hits in the section, plus a bonus for hits in its heading, so
    // "Can you ship to Canada?" lands on Shipping rather than on "Return shipping" under Returns.
    const hits = (text: string) => words.filter((w) => text.toLowerCase().includes(w.replace(/s$/, ""))).length;
    const scored = sections
      .map((s) => ({ s, score: hits(s) + hits(s.split("\n")[0] ?? "") }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    const text =
      best && best.score > 0
        ? best.s.split("\n").slice(1).join(" ").trim()
        : "I don't know the answer to that. Please email support@northwind.example.";
    return { text, model: "mock", stopReason: "end_turn" };
  }
}
