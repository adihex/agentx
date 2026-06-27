import { test, expect } from "@playwright/test";

test.describe("Music Scanner E2E Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Add page init script to mock the global WebSocket constructor in the browser
    await page.addInitScript(() => {
      (window as any).WebSocket = class MockWebSocket extends EventTarget {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;

        readyState = 1;
        url: string;
        onopen: any = null;
        onclose: any = null;
        onmessage: any = null;
        onerror: any = null;

        constructor(url: string) {
          super();
          this.url = url;

          // Trigger open event asynchronously
          setTimeout(() => {
            this.readyState = 1;
            const openEv = new Event("open");
            this.dispatchEvent(openEv);
            if (this.onopen) this.onopen(openEv);
          }, 10);
        }

        send(data: string) {
          try {
            const msg = JSON.parse(data);
            const triggerMsg = (payload: any) => {
              const ev = new MessageEvent("message", { data: JSON.stringify(payload) });
              this.dispatchEvent(ev);
              if (this.onmessage) this.onmessage(ev);
            };

            if (msg.method === "Music.StartExtraction") {
              const { songName } = msg.params;

              if (songName.toLowerCase().includes("error")) {
                // Error path simulation
                setTimeout(() => {
                  (triggerMsg({
                    method: "Music.Status",
                    params: { message: `Initializing search for "${songName}"...` },
                  }),
                    10);
                });

                setTimeout(() => {
                  triggerMsg({
                    method: "Toolchain.responseReceived",
                    params: {
                      toolName: "searchMusic",
                      result: {
                        success: false,
                        error: "Failed to resolve search results for song query",
                      },
                    },
                  });
                }, 30);
                return;
              }

              if (songName.toLowerCase().includes("hello")) {
                // Clarification path: agent asks a question
                setTimeout(() => {
                  triggerMsg({
                    method: "Music.AgentResponse",
                    params: {
                      response:
                        "I found multiple matches for Hello. Please choose: 1) Adele, 2) Lionel Richie",
                    },
                  });
                }, 20);
                return;
              }

              // Success path simulation
              setTimeout(() => {
                triggerMsg({
                  method: "Music.Status",
                  params: { message: `Searching for "${songName}"...` },
                });
              }, 20);

              setTimeout(() => {
                triggerMsg({
                  method: "Toolchain.responseReceived",
                  params: {
                    toolName: "searchMusic",
                    result: {
                      success: true,
                      bestMatch: { title: `${songName} (Official Video)` },
                    },
                  },
                });
              }, 50);

              setTimeout(() => {
                triggerMsg({
                  method: "Toolchain.responseReceived",
                  params: {
                    toolName: "downloadAndUpload",
                    result: { success: true },
                  },
                });
              }, 90);

              setTimeout(() => {
                triggerMsg({
                  method: "Toolchain.responseReceived",
                  params: {
                    toolName: "triggerCloudRun",
                    result: { success: true },
                  },
                });
              }, 140);
            }

            if (msg.method === "Session.prompt") {
              const { prompt } = msg.params;

              if (prompt === "1") {
                // Resume success extraction flow after reply
                setTimeout(() => {
                  triggerMsg({
                    method: "Music.Status",
                    params: { message: "Proceeding with Adele - Hello..." },
                  });
                }, 20);

                setTimeout(() => {
                  triggerMsg({
                    method: "Toolchain.responseReceived",
                    params: {
                      toolName: "downloadAndUpload",
                      result: { success: true },
                    },
                  });
                }, 50);

                setTimeout(() => {
                  triggerMsg({
                    method: "Toolchain.responseReceived",
                    params: {
                      toolName: "triggerCloudRun",
                      result: { success: true },
                    },
                  });
                }, 90);
              }
            }
          } catch (e) {
            console.error("Mock WebSocket Send Error:", e);
          }
        }

        close() {
          this.readyState = 3;
          setTimeout(() => {
            const closeEv = new Event("close");
            this.dispatchEvent(closeEv);
            if (this.onclose) this.onclose(closeEv);
          }, 10);
        }
      } as any;
    });
  });

  test("should complete the full music scanner pipeline successfully", async ({ page }) => {
    await page.goto("/");

    // 1. Check title and subtitle
    await expect(page.locator("h1")).toContainText("Music Scanner");
    await expect(page.locator("#music-scanner-subtitle")).toContainText("AUDIO EXTRACTION ENGINE");

    // 2. Check system log is connected
    const systemLog = page.locator("#music-scanner-card");
    await expect(systemLog).toContainText("CONNECTED");

    // 3. Type song name
    const input = page.locator("#scanner-song-input");
    await input.fill("Stairway to Heaven");

    // 4. Click scan button
    const scanBtn = page.locator("#scanner-submit-btn");
    await scanBtn.click();

    // 5. Verify the scanning workflow state progression
    await expect(page.getByTestId("step-search")).toBeVisible();
    await expect(systemLog).toContainText("Initializing extraction workflow");

    // progress to 25% (download step active)
    await expect(page.getByTestId("step-download")).toHaveCSS("opacity", "1");
    await expect(systemLog).toContainText("Downloading...");

    // progress to 50% (extract step active)
    await expect(page.getByTestId("step-extract")).toHaveCSS("opacity", "1");
    await expect(systemLog).toContainText("Triggering Cloud Run job...");

    // progress to 100% (done step completed)
    await expect(page.getByTestId("step-done")).toHaveCSS("opacity", "1");
    await expect(systemLog).toContainText("Extraction complete!");

    // Input should be enabled and empty again
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("");
  });

  test("should handle toolchain errors and allow retrying", async ({ page }) => {
    await page.goto("/");

    // 1. Check system log is connected
    const systemLog = page.locator("#music-scanner-card");
    await expect(systemLog).toContainText("CONNECTED");

    // 2. Type a song that causes failure
    const input = page.locator("#scanner-song-input");
    await input.fill("Song with Error");

    const scanBtn = page.locator("#scanner-submit-btn");
    await scanBtn.click();

    // 3. Verify error logs are printed and progress gets reset
    await expect(systemLog).toContainText("Error in searchMusic");

    // 4. Input should be enabled and cleared again
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("");
  });

  test("should allow the user to reply to clarification questions from the agent", async ({
    page,
  }) => {
    await page.goto("/");

    const systemLog = page.locator("#music-scanner-card");
    const input = page.locator("#scanner-song-input");
    const scanBtn = page.locator("#scanner-submit-btn");

    // 1. Enter song name that requires choice
    await input.fill("Hello");
    await scanBtn.click();

    // 2. Verify agent response / question is shown
    await expect(systemLog).toContainText("Agent: I found multiple matches for Hello.");

    // 3. Verify input is enabled and placeholder changes to "Type reply..."
    await expect(input).toBeEnabled();
    await expect(input).toHaveAttribute("placeholder", "Type reply...");
    await expect(scanBtn).toHaveText("Reply");

    // 4. Send choice
    await input.fill("1");
    await scanBtn.click();

    // 5. Verify the rest of the extraction workflow completes successfully
    await expect(systemLog).toContainText("Proceeding with Adele - Hello...");
    await expect(page.getByTestId("step-done")).toHaveCSS("opacity", "1");
    await expect(systemLog).toContainText("Extraction complete!");

    // 6. Input should be reset
    await expect(input).toHaveAttribute(
      "placeholder",
      "Enter song name (e.g. 'Stairway to Heaven')",
    );
    await expect(scanBtn).toHaveText("Scan");
  });
});
