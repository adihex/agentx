import { useState, useEffect, useRef } from "react";
import { ScannerInput } from "./components/ScannerInput";
import { ProgressBar } from "./components/ProgressBar";
import { StepIndicator, StepId } from "./components/StepIndicator";
import { StatusLog } from "./components/StatusLog";

export default function App() {
  const [songName, setSongName] = useState("");
  const [status, setStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState<StepId | null>(null);
  const [currentSongLabel, setCurrentSongLabel] = useState("");
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectADP();
    return () => ws.current?.close();
  }, []);

  const connectADP = () => {
    const socket = new WebSocket("ws://localhost:9222");
    ws.current = socket;

    socket.onopen = () => {
      setStatus("Connected");
      addLog("Connected to agentx runtime.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleAdpMessage(data);
    };

    socket.onclose = () => {
      setStatus("Disconnected");
      addLog("Disconnected. Retrying...");
      setTimeout(connectADP, 3000);
    };
  };

  const handleAdpMessage = (data: any) => {
    if (data.method === "Music.Status") {
      addLog(data.params.message);
    }

    if (data.method === "Music.AgentResponse") {
      const response = data.params.response;
      addLog(`Agent: ${response}`);
      if (!response.toLowerCase().includes("extraction complete")) {
        setIsWaitingForReply(true);
      }
    }

    if (data.method === "Toolchain.responseReceived") {
      const { toolName, result } = data.params;
      if (!result.success) {
        addLog(`Error in ${toolName}: ${result.error}`);
        setProgress(0);
        setActiveStep(null);
        setIsWaitingForReply(false);
        return;
      }

      if (toolName === "searchMusic") {
        setActiveStep("download");
        setProgress(25);
        addLog(`Found: ${result.bestMatch.title}. Downloading...`);
      } else if (toolName === "downloadAndUpload") {
        setActiveStep("extract");
        setProgress(50);
        addLog("Uploaded to GCS. Triggering Cloud Run job...");
      } else if (toolName === "triggerCloudRun") {
        setActiveStep("done");
        setProgress(100);
        addLog("Extraction complete! Your file is ready in the output bucket.");
        setIsWaitingForReply(false);
      }
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-4), msg]);
  };

  const startExtraction = () => {
    if (!songName.trim()) return;
    setCurrentSongLabel(songName);
    setActiveStep("search");
    setProgress(5);
    setIsWaitingForReply(false);
    addLog(`Initializing extraction workflow for "${songName}"...`);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "Music.StartExtraction",
          params: { songName },
        }),
      );
    }
    setSongName("");
  };

  const sendReply = () => {
    if (!songName.trim() || !isWaitingForReply) return;
    const reply = songName.trim();
    setIsWaitingForReply(false);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "Session.prompt",
          params: { prompt: reply },
        }),
      );
    }
    setSongName("");
  };

  const handleAction = () => {
    if (isWaitingForReply) {
      sendReply();
    } else {
      startExtraction();
    }
  };

  return (
    <div
      id="music-scanner-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#0a0c10",
      }}
    >
      <div
        id="music-scanner-card"
        style={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: "#12161f",
          borderRadius: "8px",
          padding: "2rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          border: "1px solid #222b3c",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            id="music-scanner-title"
            style={{
              margin: 0,
              color: "#f3f4f6",
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Music Scanner
          </h1>
          <span
            id="music-scanner-subtitle"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#00e5ff",
              marginTop: "0.35rem",
              fontWeight: "bold",
              letterSpacing: "0.08em",
            }}
          >
            // AGENTX AUDIO EXTRACTION ENGINE
          </span>
        </div>

        <ScannerInput
          value={songName}
          onChange={setSongName}
          onScan={handleAction}
          disabled={isWaitingForReply ? false : progress > 0 && progress < 100}
          placeholder={
            isWaitingForReply ? "Type reply..." : "Enter song name (e.g. 'Stairway to Heaven')"
          }
          buttonText={isWaitingForReply ? "Reply" : "Scan"}
        />

        {activeStep && <ProgressBar progress={progress} label={currentSongLabel} />}

        <StepIndicator activeStep={activeStep} progress={progress} />

        <StatusLog logs={logs} status={status} />
      </div>
    </div>
  );
}
