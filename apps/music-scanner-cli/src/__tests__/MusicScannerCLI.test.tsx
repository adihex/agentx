/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { MusicScannerCLI } from "../MusicScannerCLI";

// Keep track of the registered keyboard handler from useKeyboard hook
let registeredKeyboardHandler: ((event: any) => void) | null = null;

// Mock @opentui/react
vi.mock("@opentui/react", () => {
  return {
    useKeyboard: vi.fn().mockImplementation((handler) => {
      registeredKeyboardHandler = handler;
    }),
    useRenderer: vi.fn().mockReturnValue({
      destroy: vi.fn(),
    }),
  };
});

// Mock ws WebSocket client
const mockSend = vi.fn();
const mockClose = vi.fn();
let socketMessageListener: ((data: any) => void) | null = null;
let socketCloseListener: (() => void) | null = null;
let socketOpenListener: (() => void) | null = null;

vi.mock("ws", () => {
  const MockWebSocket = vi.fn().mockImplementation(function () {
    return {
      on: vi.fn((event: string, cb: any) => {
        if (event === "open") socketOpenListener = cb;
        if (event === "message") socketMessageListener = cb;
        if (event === "close") socketCloseListener = cb;
      }),
      send: mockSend,
      close: mockClose,
      readyState: 1, // WebSocket.OPEN
    };
  });
  (MockWebSocket as any).OPEN = 1;
  (MockWebSocket as any).CLOSED = 3;
  return { WebSocket: MockWebSocket };
});

describe("MusicScannerCLI component", () => {
  const onExitMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    registeredKeyboardHandler = null;
    socketMessageListener = null;
    socketCloseListener = null;
    socketOpenListener = null;
  });

  it("renders the initial view and handles WebSocket connection lifecycle", () => {
    render(<MusicScannerCLI onExit={onExitMock} />);

    // Initial state: shows DISCONNECTED and title
    expect(screen.getByText("AgentX Music Scanner CLI")).toBeInTheDocument();
    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();

    // Verify WebSocket open event shifts status to CONNECTED
    act(() => {
      if (socketOpenListener) socketOpenListener();
    });
    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    expect(screen.getByText("> Connected to agentx runtime.")).toBeInTheDocument();

    // Verify WebSocket close event shifts status back to DISCONNECTED
    act(() => {
      if (socketCloseListener) socketCloseListener();
    });
    expect(screen.getByText("DISCONNECTED")).toBeInTheDocument();
    expect(screen.getByText("> Disconnected. Retrying...")).toBeInTheDocument();
  });

  it("handles keyboard inputs and triggers song extraction successfully", () => {
    render(<MusicScannerCLI onExit={onExitMock} />);

    // 1. Establish connection
    act(() => {
      if (socketOpenListener) socketOpenListener();
    });

    // 2. Type song name via keyboard events
    expect(registeredKeyboardHandler).not.toBeNull();

    act(() => {
      registeredKeyboardHandler!({ name: "H" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "o" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "t" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "e" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "l" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "space" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "C" });
    });
    expect(screen.getByText("Hotel C")).toBeInTheDocument();

    // test backspace
    act(() => {
      registeredKeyboardHandler!({ name: "backspace" });
    });
    expect(screen.queryByText("Hotel C")).not.toBeInTheDocument();
    expect(screen.getByText("Hotel")).toBeInTheDocument();

    // 3. Press enter to start scanning
    act(() => {
      registeredKeyboardHandler!({ name: "enter" });
    });

    // Prompt is cleared and shows Processing with currentSongLabel
    expect(screen.getByText("Processing:")).toBeInTheDocument();
    expect(screen.getByText("Hotel")).toBeInTheDocument();
    expect(screen.getByText('> Initializing extraction for "Hotel"...')).toBeInTheDocument();

    // Verify correct ADP message was sent over WebSocket
    expect(mockSend).toHaveBeenCalledWith(
      expect.stringContaining('"method":"Music.StartExtraction"'),
    );
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('"songName":"Hotel"'));

    // 4. Simulate progression through toolchain events
    // Event: searchMusic complete
    act(() => {
      if (socketMessageListener) {
        socketMessageListener(
          JSON.stringify({
            method: "Toolchain.responseReceived",
            params: {
              toolName: "searchMusic",
              result: { success: true, bestMatch: { title: "Hotel California" } },
            },
          }),
        );
      }
    });
    expect(screen.getByText("> Found: Hotel California. Downloading...")).toBeInTheDocument();
    expect(screen.getByText("DOWNLOAD...")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    // Event: downloadAndUpload complete
    act(() => {
      if (socketMessageListener) {
        socketMessageListener(
          JSON.stringify({
            method: "Toolchain.responseReceived",
            params: {
              toolName: "downloadAndUpload",
              result: { success: true },
            },
          }),
        );
      }
    });
    expect(screen.getByText("> Uploaded to GCS. Triggering Cloud Run job...")).toBeInTheDocument();
    expect(screen.getByText("EXTRACT...")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    // Event: triggerCloudRun complete
    act(() => {
      if (socketMessageListener) {
        socketMessageListener(
          JSON.stringify({
            method: "Toolchain.responseReceived",
            params: {
              toolName: "triggerCloudRun",
              result: { success: true },
            },
          }),
        );
      }
    });
    expect(screen.getByText("> Extraction complete!")).toBeInTheDocument();
    // Scan completes, UI goes back to standard prompt
    expect(screen.getByText("Song:")).toBeInTheDocument();
    expect(screen.queryByText("Processing:")).not.toBeInTheDocument();
  });

  it("ignores key inputs during scanning, handles toolchain errors, and allows retrying", () => {
    render(<MusicScannerCLI onExit={onExitMock} />);

    act(() => {
      if (socketOpenListener) socketOpenListener();
    });

    // 1. Enter song name and start extraction
    act(() => {
      registeredKeyboardHandler!({ name: "B" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "a" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "d" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "enter" });
    });
    expect(screen.getByText("Processing:")).toBeInTheDocument();

    // 2. Typing while scanning should be ignored
    act(() => {
      registeredKeyboardHandler!({ name: "x" });
    });
    expect(screen.queryByText("x")).not.toBeInTheDocument();

    // 3. Simulate toolchain failure
    act(() => {
      if (socketMessageListener) {
        socketMessageListener(
          JSON.stringify({
            method: "Toolchain.responseReceived",
            params: {
              toolName: "searchMusic",
              result: { success: false, error: "Network Timeout" },
            },
          }),
        );
      }
    });

    // Verify error is logged and screen goes back to standard prompt (allows retrying)
    expect(screen.getByText("> Error in searchMusic: Network Timeout")).toBeInTheDocument();
    expect(screen.getByText("Song:")).toBeInTheDocument();
    expect(screen.queryByText("Processing:")).not.toBeInTheDocument();

    // Verify typing is allowed again after failure
    act(() => {
      registeredKeyboardHandler!({ name: "O" });
    });
    act(() => {
      registeredKeyboardHandler!({ name: "k" });
    });
    expect(screen.getByText("Ok")).toBeInTheDocument();
  });

  it("surfaces an agent question mid-scan and sends the user's reply", () => {
    render(<MusicScannerCLI onExit={onExitMock} />);

    act(() => {
      if (socketOpenListener) socketOpenListener();
    });

    // Start a scan
    act(() => registeredKeyboardHandler!({ name: "H" }));
    act(() => registeredKeyboardHandler!({ name: "i" }));
    act(() => registeredKeyboardHandler!({ name: "enter" }));
    expect(screen.getByText("Processing:")).toBeInTheDocument();

    // Agent asks the user to choose between matches
    act(() => {
      if (socketMessageListener) {
        socketMessageListener(
          JSON.stringify({
            method: "Session.message",
            params: { text: "Which one? 1) A 2) B 3) C" },
          }),
        );
      }
    });
    expect(screen.getByText("> Agent: Which one? 1) A 2) B 3) C")).toBeInTheDocument();
    // The reply affordance appears even though a scan is in progress
    expect(screen.getByText("Reply:")).toBeInTheDocument();

    // User types a reply and submits it
    mockSend.mockClear();
    act(() => registeredKeyboardHandler!({ name: "2" }));
    act(() => registeredKeyboardHandler!({ name: "enter" }));

    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('"method":"Session.prompt"'));
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('"prompt":"2"'));
    expect(screen.getByText("> You: 2")).toBeInTheDocument();
    // Reply affordance clears after sending
    expect(screen.queryByText("Reply:")).not.toBeInTheDocument();
  });

  it("calls onExit when Escape or Ctrl+C is pressed", () => {
    render(<MusicScannerCLI onExit={onExitMock} />);

    expect(onExitMock).not.toHaveBeenCalled();

    // Press Escape
    act(() => {
      registeredKeyboardHandler!({ name: "escape" });
    });
    expect(onExitMock).toHaveBeenCalledTimes(1);

    // Press Ctrl+C
    act(() => {
      registeredKeyboardHandler!({ ctrl: true, name: "c" });
    });
    expect(onExitMock).toHaveBeenCalledTimes(2);
  });
});
