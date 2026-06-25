import React from "react";

interface ScannerInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  disabled?: boolean;
}

export const ScannerInput: React.FC<ScannerInputProps> = ({
  value,
  onChange,
  onScan,
  disabled,
}) => {
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && onScan()}
        placeholder="Enter song name (e.g. 'Stairway to Heaven')"
        disabled={disabled}
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          borderRadius: "0.5rem",
          border: "1px solid #333",
          backgroundColor: "#0a0a0a",
          color: "#fff",
          outline: "none",
          opacity: disabled ? 0.6 : 1,
        }}
      />
      <button
        onClick={onScan}
        disabled={disabled || !value.trim()}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "0.5rem",
          border: "none",
          backgroundColor: "#00f2fe",
          color: "#000",
          fontWeight: "bold",
          cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
          opacity: disabled || !value.trim() ? 0.6 : 1,
        }}
      >
        Scan
      </button>
    </div>
  );
};
