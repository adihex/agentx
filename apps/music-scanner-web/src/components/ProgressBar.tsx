import React from "react";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>{label}</span>
        <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#00e5ff" }}>
          {progress}%
        </span>
      </div>
      <div
        style={{
          height: "10px",
          backgroundColor: "#07090d",
          border: "1px solid #222b3c",
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
            backgroundColor: "#00e5ff",
            transition: "width 250ms ease-out",
          }}
        />
      </div>
    </div>
  );
};
