import React, { useState } from "react";

interface ReplyPromptProps {
  /** The agent's most recent question / message. */
  question: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

/**
 * Shown when the agent asks the user something mid-extraction (e.g. "which of
 * these matches did you mean?"). The reply is sent back over the same session
 * as a `Session.prompt`, so the conversation continues in place.
 */
export const ReplyPrompt: React.FC<ReplyPromptProps> = ({ question, value, onChange, onSend }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      id="scanner-reply"
      style={{
        marginBottom: "1.5rem",
        backgroundColor: "#100a16",
        border: "1px solid #3a2b52",
        borderRadius: "8px",
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "bold",
          letterSpacing: "0.08em",
          color: "#c084fc",
          marginBottom: "0.5rem",
        }}
      >
        AGENT NEEDS YOUR INPUT
      </div>
      <div
        id="scanner-reply-question"
        style={{ fontSize: "0.875rem", color: "#e9d5ff", marginBottom: "0.75rem", lineHeight: 1.5 }}
      >
        {question}
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <input
          type="text"
          id="scanner-reply-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSend()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your answer…"
          autoFocus
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: `1px solid ${isFocused ? "#c084fc" : "#3a2b52"}`,
            backgroundColor: "#07090d",
            color: "#f3f4f6",
            fontFamily: "inherit",
            fontSize: "0.875rem",
            outline: "none",
            transition: "border-color 150ms ease-out",
          }}
        />
        <button
          id="scanner-reply-btn"
          onClick={onSend}
          disabled={!value.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: !value.trim() ? "#1b1424" : "#c084fc",
            color: !value.trim() ? "#6b7280" : "#0f0716",
            fontWeight: "bold",
            fontFamily: "inherit",
            fontSize: "0.875rem",
            cursor: !value.trim() ? "not-allowed" : "pointer",
            transition: "all 150ms ease-out",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
