import React from "react";
import { Search, Download, FileAudio, CheckCircle, Loader2, LucideIcon } from "lucide-react";

export type StepId = "search" | "download" | "extract" | "done";

interface Step {
  id: StepId;
  label: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  activeStep: StepId | null;
  progress: number;
}

const STEPS: Step[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "download", label: "Download", icon: Download },
  { id: "extract", label: "Extract", icon: FileAudio },
  { id: "done", label: "Complete", icon: CheckCircle },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ activeStep, progress }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1.0rem",
        marginBottom: "2rem",
      }}
    >
      {STEPS.map((step) => {
        const Icon = step.icon;
        const isActive = activeStep === step.id;
        const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);
        const stepIndex = STEPS.findIndex((s) => s.id === step.id);
        const isCompleted =
          progress === 100 || (activeStep !== null && currentStepIndex > stepIndex);

        let bg = "#07090d";
        let border = "1px solid #222b3c";
        let color = "#9ca3af";
        let labelColor = "#9ca3af";

        if (isCompleted) {
          bg = "#10b981";
          border = "none";
          color = "#05070a";
          labelColor = "#10b981";
        } else if (isActive) {
          bg = "#12161f";
          border = "1px solid #00e5ff";
          color = "#00e5ff";
          labelColor = "#00e5ff";
        }

        return (
          <div
            key={step.id}
            data-testid={`step-${step.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: isActive || isCompleted ? 1 : 0.5,
              transition: "opacity 200ms ease-out",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: bg,
                border: border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.5rem",
                color: color,
                transition: "all 200ms ease-out",
              }}
            >
              {isActive ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Icon size={18} />
              )}
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: isActive || isCompleted ? "bold" : "normal",
                color: labelColor,
                transition: "color 200ms ease-out",
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
