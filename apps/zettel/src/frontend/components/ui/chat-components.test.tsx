// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  MessageScroller,
  MessageScrollerProvider,
  Message,
  Bubble,
  Attachment,
  Marker,
} from "@agentx/chat-components";

describe("Message Component", () => {
  it("renders headers and body correctly", () => {
    render(
      <Message role="assistant" header={<span>Assistant Header</span>}>
        Hello world
      </Message>
    );

    expect(screen.getByText("Assistant Header")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("does not render header when isConsecutive is true", () => {
    render(
      <Message role="assistant" header={<span>Assistant Header</span>} isConsecutive={true}>
        Hello consecutive
      </Message>
    );

    expect(screen.queryByText("Assistant Header")).not.toBeInTheDocument();
    expect(screen.getByText("Hello consecutive")).toBeInTheDocument();
  });

  it("does not render the message wrapper or headers if children is empty", () => {
    const { container } = render(
      <Message role="assistant" header={<span>Assistant Header</span>}>
        {""}
      </Message>
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("Bubble Component", () => {
  it("does not render a visible bubble container if children is empty", () => {
    const { container } = render(<Bubble>{""}</Bubble>);
    expect(container.firstChild).toBeNull();
  });

  it("renders content and applies custom variant and alignment classes", () => {
    const { container } = render(
      <Bubble variant="accent" align="right">
        Bubble Text
      </Bubble>
    );

    expect(screen.getByText("Bubble Text")).toBeInTheDocument();
    const bubbleElement = container.querySelector(".chat-bubble");
    expect(bubbleElement).toHaveClass("chat-bubble-accent");
    expect(bubbleElement).toHaveClass("chat-bubble-align-right");
  });
});

describe("Attachment Component", () => {
  it("renders audio attachment with name, size and audio type styles", () => {
    const { container } = render(
      <Attachment name="recording.webm" size="145 KB" type="audio" />
    );

    expect(screen.getByText("recording.webm")).toBeInTheDocument();
    expect(screen.getByText("145 KB")).toBeInTheDocument();
    const element = container.querySelector(".chat-attachment");
    expect(element).toHaveClass("chat-attachment-audio");
  });

  it("triggers onRemove when delete button clicked", () => {
    const handleRemove = vi.fn();
    render(
      <Attachment name="test.txt" onRemove={handleRemove} />
    );

    const button = screen.getByRole("button", { name: "Remove attachment" });
    button.click();
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});

describe("Marker Component", () => {
  it("renders status indicator and applies shimmer class if requested", () => {
    const { container } = render(
      <Marker type="tool" shimmer={true}>
        Tool executing...
      </Marker>
    );

    expect(screen.getByText("Tool executing...")).toBeInTheDocument();
    const element = container.querySelector(".chat-marker");
    expect(element).toHaveClass("chat-marker-tool");
    expect(element).toHaveClass("chat-marker-shimmer");
  });
});

describe("MessageScroller Component", () => {
  it("renders provider and layout components without crash", () => {
    render(
      <MessageScrollerProvider>
        <MessageScroller>
          <div>Scroller content</div>
        </MessageScroller>
      </MessageScrollerProvider>
    );

    expect(screen.getByText("Scroller content")).toBeInTheDocument();
  });
});
