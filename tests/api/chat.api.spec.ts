import { test, expect } from "../fixtures.js";

test.describe("POST /api/chat contract", () => {
  test("health endpoint reports provider", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toMatchObject({ status: "ok" });
  });

  test("returns a non-empty reply for a valid request", async ({ chat }) => {
    const body = await chat.ask("What is your return policy?");
    expect(body.reply.length).toBeGreaterThan(0);
    expect(typeof body.model).toBe("string");
  });

  test("accepts a multi-turn conversation", async ({ chat }) => {
    const body = await chat.ask([
      { role: "user", content: "I'm a Northwind member." },
      { role: "assistant", content: "Thanks for being a member! How can I help?" },
      { role: "user", content: "Do I pay for return shipping?" },
    ]);
    expect(body.reply.length).toBeGreaterThan(0);
  });

  test("rejects an empty message list", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [] } });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_request" });
  });

  test("rejects a conversation that does not end with a user turn", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }] },
    });
    expect(res.status()).toBe(400);
  });

  test("rejects messages over 2000 characters", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "a".repeat(2001) }] } });
    expect(res.status()).toBe(400);
  });

  test("accepts a message of exactly 2000 characters", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "a".repeat(2000) }] } });
    expect(res.status()).toBe(200);
  });

  test("rejects an empty message", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "" }] } });
    expect(res.status()).toBe(400);
  });

  // "system" would let a caller inject their own system prompt through the API.
  for (const role of ["system", "admin", ""]) {
    test(`rejects a message with role "${role}"`, async ({ request }) => {
      const res = await request.post("/api/chat", { data: { messages: [{ role, content: "hi" }] } });
      expect(res.status()).toBe(400);
    });
  }

  test("rejects a body without a messages field", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { message: "hi" } });
    expect(res.status()).toBe(400);
  });

  test("answers malformed JSON with a JSON 400, not an HTML error page", async ({ request }) => {
    const res = await request.post("/api/chat", {
      headers: { "content-type": "application/json" },
      data: '{"messages": [',
    });
    expect(res.status()).toBe(400);
    expect(res.headers()["content-type"]).toContain("application/json");
    expect(await res.json()).toEqual({ error: "invalid_json" });
  });

  test("rejects a non-JSON body", async ({ request }) => {
    const res = await request.post("/api/chat", { headers: { "content-type": "text/plain" }, data: "hello" });
    expect(res.status()).toBe(400);
  });

  test("rejects a payload over the 100 kB body limit with a JSON 413", async ({ request }) => {
    const messages = Array.from({ length: 61 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "a".repeat(1900) }));
    const res = await request.post("/api/chat", { data: { messages } });
    expect(res.status()).toBe(413);
    expect(await res.json()).toEqual({ error: "payload_too_large" });
  });

  test("responds within the latency budget", async ({ chat }) => {
    // The mock answers instantly, so its budget catches server-side slowness; the real model gets room to think.
    const budgetMs = (await chat.provider()) === "mock" ? 1_000 : 30_000;
    const started = Date.now();
    await chat.ask("How fast is express shipping?");
    const elapsed = Date.now() - started;
    test.info().annotations.push({ type: "latency", description: `${elapsed} ms` });
    expect(elapsed).toBeLessThan(budgetMs);
  });
});
