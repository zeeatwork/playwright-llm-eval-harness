import { test as base, expect, type APIRequestContext } from "@playwright/test";

export type ChatResponse = { reply: string; model: string; stopReason: string | null };

export class ChatApi {
  constructor(private request: APIRequestContext) {}

  async ask(message: string): Promise<ChatResponse> {
    const res = await this.request.post("/api/chat", { data: { messages: [{ role: "user", content: message }] } });
    expect(res.status(), await res.text()).toBe(200);
    return res.json();
  }
}

export const test = base.extend<{ chat: ChatApi }>({
  chat: async ({ request }, use) => use(new ChatApi(request)),
});
export { expect };
