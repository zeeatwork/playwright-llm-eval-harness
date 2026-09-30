import { test, expect } from "@playwright/test";

test.describe("chat UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("customer asks about returns and sees the 30-day policy", async ({ page }) => {
    await page.getByTestId("chat-input").fill("How long do I have to return something?");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("user-message")).toHaveText("How long do I have to return something?");
    await expect(page.getByTestId("bot-message").last()).toContainText("30 days");
  });

  test("shows an error message when the API fails", async ({ page }) => {
    await page.route("/api/chat", (route) => route.fulfill({ status: 500, body: "{}" }));
    await page.getByTestId("chat-input").fill("Hello?");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-error")).toBeVisible();
    await expect(page.getByTestId("chat-send")).toBeEnabled();
  });

  // TODO: send disabled while pending, Enter key submits, multi-turn history, mobile viewport
});
