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
        gap: "1rem",
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

        return (
          <div
            key={step.id}
            data-testid={`step-${step.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: isActive || isCompleted ? 1 : 0.3,
              transition: "opacity 0.3s",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: isCompleted ? "#00f2fe" : "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.5rem",
                color: isCompleted ? "#000" : "#fff",
              }}
            >
              {isActive ? (
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Icon size={20} />
              )}
            </div>
            <span style={{ fontSize: "0.75rem", color: isCompleted ? "#00f2fe" : "#fff" }}>
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
