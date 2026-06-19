import React from "react";

interface StatusLogProps {
  logs: string[];
  status: "Connected" | "Disconnected";
}

export const StatusLog: React.FC<StatusLogProps> = ({ logs, status }) => {
  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        borderRadius: "0.5rem",
        padding: "1rem",
        border: "1px solid #333",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "#666",
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>SYSTEM LOG</span>
        <span style={{ color: status === "Connected" ? "#4caf50" : "#f44336" }}>
          {status.toUpperCase()}
        </span>
      </div>
      {logs.map((log, i) => (
        <div
          key={i}
          style={{
            fontSize: "0.875rem",
            color: "#ddd",
            marginBottom: "0.25rem",
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
