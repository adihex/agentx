import React from "react";

interface StatusLogProps {
  logs: string[];
  status: "Connected" | "Disconnected";
}

export const StatusLog: React.FC<StatusLogProps> = ({ logs, status }) => {
  return (
    <div
      style={{
        backgroundColor: "#07090d",
        borderRadius: "8px",
        padding: "1rem",
        border: "1px solid #222b3c",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: "bold",
          color: "#9ca3af",
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #222b3c",
          paddingBottom: "0.5rem",
        }}
      >
        <span>SYSTEM LOG</span>
        <span style={{ color: status === "Connected" ? "#10b981" : "#ef4444" }}>
          {status.toUpperCase()}
        </span>
      </div>
      {logs.map((log, i) => (
        <div
          key={i}
          style={{
            fontSize: "0.8125rem",
            fontFamily: "monospace",
            color: "#d1d5db",
            marginBottom: "0.35rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {`> ${log}`}
        </div>
      ))}
    </div>
  );
};
