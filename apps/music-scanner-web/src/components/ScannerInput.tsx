import React, { useState } from "react";

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
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
      <input
        type="text"
        id="scanner-song-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && onScan()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Enter song name (e.g. 'Stairway to Heaven')"
        disabled={disabled}
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: `1px solid ${isFocused ? "#00e5ff" : "#222b3c"}`,
          backgroundColor: "#07090d",
          color: "#f3f4f6",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          outline: "none",
          transition: "border-color 150ms ease-out",
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <button
        id="scanner-submit-btn"
        onClick={onScan}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled || !value.trim()}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor:
            disabled || !value.trim() ? "#12161f" : isHovered ? "#00b8cc" : "#00e5ff",
          color: disabled || !value.trim() ? "#9ca3af" : "#05070a",
          fontWeight: "bold",
          fontFamily: "inherit",
          fontSize: "0.875rem",
          cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
          transition: "all 150ms ease-out",
          boxShadow: disabled || !value.trim() ? "none" : "0 2px 4px rgba(0, 229, 255, 0.1)",
        }}
      >
        Scan
      </button>
    </div>
  );
};
