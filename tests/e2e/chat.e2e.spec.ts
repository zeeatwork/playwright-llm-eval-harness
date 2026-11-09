import { test, expect, type Page } from "@playwright/test";

async function send(page: Page, text: string) {
  await page.getByTestId("chat-input").fill(text);
  await page.getByTestId("chat-send").click();
}

test.describe("chat UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("customer asks about returns and sees the 30-day policy", async ({ page }) => {
    await send(page, "How long do I have to return something?");
    await expect(page.getByTestId("user-message")).toHaveText("How long do I have to return something?");
    await expect(page.getByTestId("bot-message").last()).toContainText("30 days");
  });

  test("shows an error message when the API fails", async ({ page }) => {
    await page.route("/api/chat", (route) => route.fulfill({ status: 500, body: "{}" }));
    await send(page, "Hello?");
    await expect(page.getByTestId("chat-error")).toBeVisible();
    await expect(page.getByTestId("chat-send")).toBeEnabled();
  });

  test("pressing Enter sends the message", async ({ page }) => {
    await page.getByTestId("chat-input").fill("How fast is express shipping?");
    await page.getByTestId("chat-input").press("Enter");
    await expect(page.getByTestId("user-message")).toHaveText("How fast is express shipping?");
    await expect(page.getByTestId("bot-message")).toHaveCount(1);
    await expect(page.getByTestId("chat-input")).toHaveValue("");
  });

  test("send is disabled while a reply is pending, then re-enabled", async ({ page }) => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("/api/chat", async (route) => {
      await held;
      await route.continue();
    });
    await send(page, "Is membership free?");
    await expect(page.getByTestId("chat-send")).toBeDisabled();
    release();
    await expect(page.getByTestId("bot-message")).toHaveCount(1);
    await expect(page.getByTestId("chat-send")).toBeEnabled();
  });

  test("an empty or whitespace-only message is not sent", async ({ page }) => {
    let calls = 0;
    await page.route("/api/chat", (route) => {
      calls++;
      return route.continue();
    });
    await send(page, "   ");
    await expect(page.getByTestId("user-message")).toHaveCount(0);
    expect(calls).toBe(0);
  });

  test("sends the full conversation history on each turn", async ({ page }) => {
    await send(page, "I'm a Northwind member.");
    await expect(page.getByTestId("bot-message")).toHaveCount(1);

    const request = page.waitForRequest("/api/chat");
    await send(page, "Do I pay for return shipping?");
    const body = (await request).postDataJSON() as { messages: { role: string; content: string }[] };

    expect(body.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(body.messages[0]?.content).toBe("I'm a Northwind member.");
    expect(body.messages.at(-1)?.content).toBe("Do I pay for return shipping?");
    await expect(page.getByTestId("bot-message")).toHaveCount(2);
    await expect(page.getByTestId("user-message")).toHaveCount(2);
  });

  test("a failed turn is not sent again as history", async ({ page }) => {
    await page.route("/api/chat", (route) => route.fulfill({ status: 500, body: "{}" }), { times: 1 });
    await send(page, "First try");
    await expect(page.getByTestId("chat-error")).toBeVisible();

    const request = page.waitForRequest("/api/chat");
    await send(page, "Second try");
    const body = (await request).postDataJSON() as { messages: { role: string; content: string }[] };
    expect(body.messages).toEqual([{ role: "user", content: "Second try" }]);
    await expect(page.getByTestId("chat-error")).toBeHidden();
  });
});

test.describe("chat UI on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("works at phone width without horizontal scrolling", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("chat-send")).toBeInViewport();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.getByTestId("chat-input").fill("Can you ship to Canada?");
    await page.getByTestId("chat-send").tap();
    await expect(page.getByTestId("bot-message")).toContainText("United States");
  });
});
