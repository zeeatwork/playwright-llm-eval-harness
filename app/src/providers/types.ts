export type ChatTurn = { role: "user" | "assistant"; content: string };

export type BotReply = {
  text: string;
  model: string;
  /** "refusal" when the model's safety classifiers declined; tests may treat this as a pass for attack prompts. */
  stopReason: string | null;
};

export interface LlmProvider {
  name: string;
  complete(system: string, history: ChatTurn[]): Promise<BotReply>;
}
