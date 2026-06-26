import { test, expect } from "@playwright/test";

test.describe("Zettel Multi-tenant E2E Tests", () => {
  const timestamp = Date.now();
  const emailA = `usera-${timestamp}@example.com`;
  const emailB = `userb-${timestamp}@example.com`;
  const password = "password123";

  test("should register, write notes via agent chat, and isolate data between tenants", async ({
    page,
  }) => {
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.stack || err.message));
    page.on("request", (req) => {
      if (req.url().includes("/api/auth")) {
        console.log("PLAYWRIGHT REQ:", req.method(), req.url(), req.postData() || "");
      }
    });
    page.on("response", (res) => {
      if (res.url().includes("/api/auth")) {
        res
          .text()
          .then((t) => console.log("PLAYWRIGHT RES:", res.status(), res.url(), t))
          .catch(() => {});
      }
    });

    // -------------------------------------------------------------
    // 1. Sign up User A
    // -------------------------------------------------------------
    await page.goto("/");

    // Switch to Register mode
    await page.getByRole("button", { name: "Create a workspace" }).click();
    await expect(page.locator("#auth-name")).toBeVisible();

    // Fill in signup fields
    await page.locator("#auth-name").fill("User A");
    await page.locator("#auth-email").fill(emailA);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Create workspace", exact: true }).click();

    // Verify main page loaded
    await expect(page.locator("text=A quiet place to think.")).toBeVisible();
    await expect(page.locator("text=No notes yet.")).toBeVisible();

    // -------------------------------------------------------------
    // 2. User A chats with Agent to create notes about apples
    // -------------------------------------------------------------
    const inputA = page.getByPlaceholder("Capture a thought…");
    await expect(inputA).toBeEnabled();
    await inputA.fill("Write a note about apples.");
    await inputA.press("Enter");

    // Wait for the agent message response in the thread panel
    // Our mocked LLM will return: "I have successfully created the note for you."
    const turnAssistantA = page.locator(".turn-assistant");
    await expect(turnAssistantA.last()).toContainText("successfully created the note");

    // Verify that the note is added to the sidebar note rail
    const firstNoteA = page.locator(".index-item");
    await expect(firstNoteA).toHaveCount(1);
    await expect(firstNoteA.locator(".index-item-title")).toContainText("About Apples");

    // Sign out User A
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("text=Sign in to your study")).toBeVisible();

    // -------------------------------------------------------------
    // 3. Sign up User B
    // -------------------------------------------------------------
    await page.getByRole("button", { name: "Create a workspace" }).click();
    await expect(page.locator("#auth-name")).toBeVisible();
    await page.locator("#auth-name").fill("User B");
    await page.locator("#auth-email").fill(emailB);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Create workspace", exact: true }).click();

    // Verify User B main page loaded, starting with 0 notes
    await expect(page.locator("text=A quiet place to think.")).toBeVisible();
    await expect(page.locator("text=No notes yet.")).toBeVisible();

    // -------------------------------------------------------------
    // 4. User B chats with Agent to create notes about oranges
    // -------------------------------------------------------------
    const inputB = page.getByPlaceholder("Capture a thought…");
    await expect(inputB).toBeEnabled();
    await inputB.fill("Write a note about oranges.");
    await inputB.press("Enter");

    // Wait for the agent message response in the thread panel
    const turnAssistantB = page.locator(".turn-assistant");
    await expect(turnAssistantB.last()).toContainText("successfully created the note");

    // Verify that the note is added to the sidebar note rail
    const firstNoteB = page.locator(".index-item");
    await expect(firstNoteB).toHaveCount(1);
    await expect(firstNoteB.locator(".index-item-title")).toContainText("About Oranges");

    // Verify User B cannot see User A's note "About Apples"
    await expect(page.locator("text=About Apples")).not.toBeVisible();

    // Sign out User B
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("text=Sign in to your study")).toBeVisible();

    // -------------------------------------------------------------
    // 5. Log back in as User A and verify note persistence and isolation
    // -------------------------------------------------------------
    await page.locator("#auth-email").fill(emailA);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // Verify User A's note is restored and User B's note is NOT visible
    await expect(page.locator("text=A quiet place to think.")).toBeVisible();
    const notesRailA = page.locator(".index-item");
    await expect(notesRailA).toHaveCount(1);
    await expect(notesRailA.locator(".index-item-title")).toContainText("About Apples");
    await expect(page.locator("text=About Oranges")).not.toBeVisible();

    // Cleanup session by signing out
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("text=Sign in to your study")).toBeVisible();
  });
});
