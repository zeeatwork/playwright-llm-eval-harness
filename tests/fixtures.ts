import { test as base, expect, type APIRequestContext } from "@playwright/test";

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type ChatResponse = { reply: string; model: string; stopReason: string | null };

export class ChatApi {
  constructor(private request: APIRequestContext) {}

  /** Send one user message, or a whole conversation that ends with a user turn. */
  async ask(input: string | ChatTurn[]): Promise<ChatResponse> {
    const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
    const res = await this.request.post("/api/chat", { data: { messages } });
    expect(res.status(), await res.text()).toBe(200);
    return res.json();
  }

  /** Which provider the server is running on ("mock" or "anthropic"). */
  async provider(): Promise<string> {
    const res = await this.request.get("/api/health");
    return (await res.json()).provider;
  }
}

export const test = base.extend<{ chat: ChatApi }>({
  chat: async ({ request }, use) => use(new ChatApi(request)),
});
export { expect };
