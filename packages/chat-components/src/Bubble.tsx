import React, { type ReactNode } from "react";

interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted" | "accent" | "error";
  align?: "left" | "right" | "center";
  reactions?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

function isElementEmpty(element: any): boolean {
  if (!element) return true;
  if (typeof element === "string" || typeof element === "number") {
    return String(element).trim() === "";
  }
  if (Array.isArray(element)) {
    return element.length === 0 || element.every(isElementEmpty);
  }
  if (element.props) {
    if (element.props.children !== undefined) {
      return isElementEmpty(element.props.children);
    }
    return false;
  }
  return false;
}

export function Bubble({
  variant = "default",
  align = "left",
  reactions,
  actions,
  children,
  className,
  ...props
}: BubbleProps) {
  if (isElementEmpty(children)) {
    return null;
  }

  return (
    <div
      className={`chat-bubble chat-bubble-${variant} chat-bubble-align-${align} ${
        className || ""
      }`}
      {...props}
    >
      <div className="chat-bubble-content">{children}</div>
      {(reactions || actions) && (
        <div className="chat-bubble-meta-row">
          {reactions && <div className="chat-bubble-reactions">{reactions}</div>}
          {actions && <div className="chat-bubble-actions">{actions}</div>}
        </div>
      )}
    </div>
  );
}
