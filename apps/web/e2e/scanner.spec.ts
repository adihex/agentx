import { test, expect } from "@playwright/test";

test.describe("Music Scanner E2E", () => {
  test("should load the page and allow entering a song name", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Music Scanner");

    const input = page.getByPlaceholder(/Enter song name/i);
    await input.fill("Hotel California");

    const scanBtn = page.getByRole("button", { name: /Scan/i });
    await expect(scanBtn).toBeEnabled();
  });
});
