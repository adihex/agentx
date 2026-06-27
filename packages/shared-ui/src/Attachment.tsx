import React, { type ReactNode } from "react";

interface AttachmentProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: string;
  type?: "audio" | "image" | "document" | "generic";
  state?: "uploading" | "transcribing" | "ready" | "failed";
  progress?: number;
  onRemove?: () => void;
  onClick?: () => void;
  children?: ReactNode;
}

export function Attachment({
  name,
  size,
  type = "generic",
  state = "ready",
  progress,
  onRemove,
  onClick,
  children,
  className,
  ...props
}: AttachmentProps) {
  return (
    <div
      className={`chat-attachment chat-attachment-${type} chat-attachment-state-${state} ${
        className || ""
      }`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      {...props}
    >
      <div className="chat-attachment-icon">
        {type === "audio" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        ) : type === "image" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        )}
      </div>

      <div className="chat-attachment-info">
        <div className="chat-attachment-name">{name}</div>
        <div className="chat-attachment-meta">
          {size && <span className="chat-attachment-size">{size}</span>}
          {state !== "ready" && (
            <span className={`chat-attachment-status chat-attachment-status-${state}`}>
              {state === "uploading" ? `Uploading...${progress !== undefined ? ` ${progress}%` : ""}` : state}
            </span>
          )}
        </div>
      </div>

      {children && <div className="chat-attachment-content">{children}</div>}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="chat-attachment-remove"
          aria-label="Remove attachment"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
