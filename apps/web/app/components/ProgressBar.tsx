import React from "react";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "#aaa" }}>{label}</span>
        <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#00f2fe" }}>
          {progress}%
        </span>
      </div>
      <div
        style={{
          height: "8px",
          backgroundColor: "#0a0a0a",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
};
