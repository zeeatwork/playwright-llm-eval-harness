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

  test("rejects an empty message list", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { messages: [] } });
    expect(res.status()).toBe(400);
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

  // TODO: invalid role, non-JSON body, multi-turn context, response time budget
});
