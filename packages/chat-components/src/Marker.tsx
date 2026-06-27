import React, { type ReactNode } from "react";

interface MarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "system" | "status" | "date" | "tool";
  shimmer?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Marker({
  type = "status",
  shimmer = false,
  icon,
  children,
  className,
  ...props
}: MarkerProps) {
  return (
    <div
      className={`chat-marker chat-marker-${type} ${
        shimmer ? "chat-marker-shimmer text-shimmer" : ""
      } ${className || ""}`}
      {...props}
    >
      {icon && <span className="chat-marker-icon">{icon}</span>}
      <span className="chat-marker-text">{children}</span>
    </div>
  );
}
