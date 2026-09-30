import { AnthropicProvider } from "./anthropic.js";
import { MockProvider } from "./mock.js";
import type { LlmProvider } from "./types.js";

export function createProvider(name = process.env.LLM_PROVIDER ?? "mock"): LlmProvider {
  if (name === "anthropic") return new AnthropicProvider();
  if (name === "mock") return new MockProvider();
  throw new Error(`Unknown LLM_PROVIDER "${name}" (expected "mock" or "anthropic")`);
}
