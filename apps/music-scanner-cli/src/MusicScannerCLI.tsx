import React, { useState, useEffect, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import { WebSocket } from "ws";

const Box = (props: any) => <box {...props} />;
const Text = (props: any) => <text {...props} />;

export const MusicScannerCLI = ({ onExit }: { onExit: () => void }) => {
  const [songName, setSongName] = useState("");
  const [currentSongLabel, setCurrentSongLabel] = useState("");
  const [status, setStatus] = useState("DISCONNECTED");
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectADP();
    return () => ws.current?.close();
  }, []);

  const connectADP = () => {
    const socket = new WebSocket("ws://localhost:9222");
    ws.current = socket;

    socket.on("open", () => {
      setStatus("CONNECTED");
      addLog("Connected to agentx runtime.");
    });

    socket.on("message", (data: string) => {
      try {
        const msg = JSON.parse(data);
        handleAdpMessage(msg);
      } catch {}
    });

    socket.on("close", () => {
      setStatus("DISCONNECTED");
      addLog("Disconnected. Retrying...");
      setTimeout(connectADP, 3000);
    });
  };

  const handleAdpMessage = (data: any) => {
    if (data.method === "Music.Status") {
      addLog(data.params.message);
    }
    if (data.method === "Toolchain.responseReceived") {
      const { toolName, result } = data.params;
      if (!result.success) {
        addLog(`Error in ${toolName}: ${result.error}`);
        setIsScanning(false);
        setProgress(0);
        setActiveStep(null);
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
        addLog("Extraction complete!");
        setIsScanning(false);
      }
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-8), msg]);
  };

  const startExtraction = () => {
    if (!songName.trim() || isScanning) return;
    const name = songName.trim();
    setCurrentSongLabel(name);
    setIsScanning(true);
    setActiveStep("search");
    setProgress(5);
    addLog(`Initializing extraction for "${name}"...`);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "Music.StartExtraction",
          params: { songName: name },
        }),
      );
    }
    setSongName("");
  };

  useKeyboard((event) => {
    if (event.name === "escape" || (event.ctrl && event.name === "c")) {
      onExit();
      return;
    }

    if (isScanning) return;

    if (event.name === "return" || event.name === "enter") {
      startExtraction();
    } else if (event.name === "backspace") {
      setSongName((prev) => prev.slice(0, -1));
    } else if (event.name === "space") {
      setSongName((prev) => prev + " ");
    } else if (!event.ctrl && !event.meta && !event.option && event.name.length === 1) {
      setSongName((prev) => prev + event.name);
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          AgentX Music Scanner CLI
        </Text>
        <Box marginLeft="auto">
          <Text color={status === "CONNECTED" ? "green" : "red"}>{status}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" height={10} borderStyle="single" paddingX={1} marginBottom={1}>
        {logs.map((log, i) => (
          <Text key={i} color="gray">{`> ${log}`}</Text>
        ))}
      </Box>

      {isScanning && (
        <Box flexDirection="column" marginBottom={1}>
          <Box justifyContent="space-between">
            <Text color="yellow">{activeStep?.toUpperCase() || "INITIALIZING"}...</Text>
            <Text bold color="cyan">
              {progress}%
            </Text>
          </Box>
          <Text color="cyan">
            {"█".repeat(Math.floor(progress / 2))}
            {"░".repeat(50 - Math.floor(progress / 2))}
          </Text>
        </Box>
      )}

      {isScanning ? (
        <Box>
          <Text bold color="yellow">
            Processing:{" "}
          </Text>
          <Text color="white">{currentSongLabel}</Text>
        </Box>
      ) : (
        <Box>
          <Text bold>Song: </Text>
          <Text color="white">{songName}</Text>
          {songName.length === 0 && <Text color="gray"> (type song name and press Enter)</Text>}
          <Text color="cyan">█</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press Esc or Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};
