import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type RefObject,
} from "react";

interface MessageScrollerContextType {
  viewportRef: RefObject<HTMLDivElement | null>;
  isAtBottom: boolean;
  setIsAtBottom: (val: boolean) => void;
  hasNewMessages: boolean;
  setHasNewMessages: (val: boolean) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

const MessageScrollerContext = createContext<MessageScrollerContextType | undefined>(undefined);

export function useMessageScroller() {
  const context = useContext(MessageScrollerContext);
  if (!context) {
    throw new Error("useMessageScroller must be used within a MessageScrollerProvider");
  }
  return context;
}

interface ProviderProps {
  children: ReactNode;
}

export function MessageScrollerProvider({ children }: ProviderProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
      setIsAtBottom(true);
      setHasNewMessages(false);
    }
  }, []);

  return (
    <MessageScrollerContext.Provider
      value={{
        viewportRef,
        isAtBottom,
        setIsAtBottom,
        hasNewMessages,
        setHasNewMessages,
        scrollToBottom,
      }}
    >
      {children}
    </MessageScrollerContext.Provider>
  );
}

interface MessageScrollerProps {
  children: ReactNode;
  className?: string;
}

export function MessageScroller({ children, className }: MessageScrollerProps) {
  return (
    <div className={`message-scroller-root ${className || ""}`} style={{ position: "relative", height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}

interface ViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MessageScrollerViewport({ children, className, ...props }: ViewportProps) {
  const { viewportRef, setIsAtBottom, setHasNewMessages } = useMessageScroller();

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const isCloseToBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 10;
    setIsAtBottom(isCloseToBottom);
    if (isCloseToBottom) {
      setHasNewMessages(false);
    }
  }, [setIsAtBottom, setHasNewMessages, viewportRef]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleScroll, viewportRef]);

  return (
    <div
      ref={viewportRef}
      onScroll={handleScroll}
      className={`message-scroller-viewport ${className || ""}`}
      style={{
        overflowY: "auto",
        flex: "1 1 0%",
        minHeight: 0,
        width: "100%",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MessageScrollerContent({ children, className, ...props }: ContentProps) {
  const { viewportRef, isAtBottom, setHasNewMessages, scrollToBottom } = useMessageScroller();
  const childrenCount = React.Children.count(children);
  const prevChildrenCountRef = useRef(childrenCount);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const countDiff = childrenCount - prevChildrenCountRef.current;
    prevChildrenCountRef.current = childrenCount;

    if (countDiff > 0) {
      if (isAtBottom) {
        scrollToBottom("smooth");
      } else {
        setHasNewMessages(true);
      }
    }
  }, [childrenCount, isAtBottom, scrollToBottom, setHasNewMessages, viewportRef]);

  return (
    <div
      role="log"
      aria-relevant="additions"
      className={`message-scroller-content ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  messageId: string;
  scrollAnchor?: boolean;
}

export function MessageScrollerItem({ children, messageId, scrollAnchor, className, ...props }: ItemProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollAnchor && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [scrollAnchor]);

  return (
    <div
      ref={itemRef}
      data-message-id={messageId}
      className={`message-scroller-item ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function MessageScrollerButton({ label = "Jump to newest message", className, ...props }: ButtonProps) {
  const { isAtBottom, hasNewMessages, scrollToBottom } = useMessageScroller();

  if (isAtBottom && !hasNewMessages) return null;

  return (
    <button
      type="button"
      onClick={() => scrollToBottom("smooth")}
      className={`message-scroller-btn ${className || ""}`}
      aria-label={label}
      {...props}
    >
      {hasNewMessages ? "New message below ↓" : "Scroll to bottom ↓"}
    </button>
  );
}
