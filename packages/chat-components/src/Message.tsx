import React, { type ReactNode } from "react";

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: "user" | "assistant" | "system" | "tool";
  isConsecutive?: boolean;
  avatar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
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

export function Message({
  role,
  isConsecutive = false,
  avatar,
  header,
  footer,
  children,
  className,
  ...props
}: MessageProps) {
  if (isElementEmpty(children)) {
    return null;
  }

  return (
    <div
      className={`chat-message chat-message-${role} ${
        isConsecutive ? "chat-message-consecutive" : ""
      } ${className || ""}`}
      {...props}
    >
      {!isConsecutive && (avatar || header) && (
        <div className="chat-message-header-row">
          {avatar && <div className="chat-message-avatar">{avatar}</div>}
          {header && <div className="chat-message-header">{header}</div>}
        </div>
      )}
      <div className="chat-message-body">{children}</div>
      {footer && <div className="chat-message-footer">{footer}</div>}
    </div>
  );
}
