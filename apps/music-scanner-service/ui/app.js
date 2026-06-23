/**
 * Music Scanner UI Logic
 * Connects to the agentx orchestrator via ADP (WebSocket).
 */

class MusicScannerUI {
  constructor() {
    this.ws = null;
    this.songInput = document.getElementById("songInput");
    this.scanBtn = document.getElementById("scanBtn");
    this.progressSection = document.getElementById("progressSection");
    this.currentSong = document.getElementById("currentSong");
    this.progressBar = document.getElementById("progressBar");
    this.progressPercent = document.getElementById("progressPercent");
    this.statusLog = document.getElementById("statusLog");

    this.steps = {
      search: document.getElementById("step-search"),
      download: document.getElementById("step-download"),
      extract: document.getElementById("step-extract"),
      done: document.getElementById("step-done"),
    };

    this.init();
  }

  init() {
    this.connectADP();
    this.scanBtn.addEventListener("click", () => this.startExtraction());
    this.songInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.startExtraction();
    });
  }

  connectADP() {
    // Connect to the orchestrator's ADP port
    this.ws = new WebSocket("ws://localhost:9222");

    this.ws.onopen = () => {
      console.log("Connected to Music Scanner Orchestrator");
      this.statusLog.innerText = "Connected to agentx runtime.";
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleAdpMessage(data);
    };

    this.ws.onclose = () => {
      console.log("Disconnected from Orchestrator");
      this.statusLog.innerText = "Disconnected. Retrying...";
      setTimeout(() => this.connectADP(), 3000);
    };
  }

  handleAdpMessage(data) {
    // Handle standard ADP events and custom ones
    if (data.method === "Music.Status") {
      this.updateStatus(data.params.message);
    }

    if (data.method === "Toolchain.responseReceived") {
      this.handleToolResponse(data.params.toolName, data.params.result);
    }
  }

  handleToolResponse(toolName, result) {
    if (!result.success) {
      this.updateStatus(`Error in ${toolName}: ${result.error}`);
      return;
    }

    if (toolName === "searchMusic") {
      this.activateStep("download");
      this.updateProgress(25);
      this.updateStatus(`Found: ${result.bestMatch.title}. Downloading...`);
    } else if (toolName === "downloadAndUpload") {
      this.activateStep("extract");
      this.updateProgress(50);
      this.updateStatus("Uploaded to GCS. Triggering Cloud Run job...");
    } else if (toolName === "triggerCloudRun") {
      this.activateStep("done");
      this.updateProgress(100);
      this.updateStatus("Extraction complete! Your file is ready in the output bucket.");
    }
  }

  startExtraction() {
    const songName = this.songInput.value.trim();
    if (!songName) return;

    this.currentSong.innerText = `Scan Progress: "${songName}"`;
    this.progressSection.classList.remove("hidden");
    this.activateStep("search");
    this.updateProgress(5);
    this.updateStatus("Initializing extraction workflow...");

    // Send custom ADP command to the service
    this.sendAdpCommand("Music.StartExtraction", { songName });
  }

  activateStep(stepKey) {
    Object.values(this.steps).forEach((el) => el.classList.remove("active"));
    if (this.steps[stepKey]) {
      this.steps[stepKey].classList.add("active");
    }
  }

  updateProgress(percent) {
    this.progressBar.style.width = `${percent}%`;
    this.progressPercent.innerText = `${percent}%`;
  }

  updateStatus(msg) {
    this.statusLog.innerText = msg;
  }

  sendAdpCommand(method, params = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const id = Math.floor(Math.random() * 1000);
      this.ws.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          method,
          params,
        }),
      );
    }
  }
}

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
  new MusicScannerUI();
});
