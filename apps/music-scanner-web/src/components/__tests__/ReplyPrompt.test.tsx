/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReplyPrompt } from "../ReplyPrompt";

describe("ReplyPrompt", () => {
  it("shows the agent's question and disables Send until there is input", () => {
    const onChange = vi.fn();
    const onSend = vi.fn();
    render(
      <ReplyPrompt question="Which match did you mean?" value="" onChange={onChange} onSend={onSend} />,
    );

    expect(screen.getByText("AGENT NEEDS YOUR INPUT")).toBeInTheDocument();
    expect(screen.getByText("Which match did you mean?")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeDisabled();

    // Toggle focus state (covers the focused/blurred border branch).
    const input = screen.getByPlaceholderText("Type your answer…");
    fireEvent.focus(input);
    fireEvent.blur(input);

    fireEvent.change(input, { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("sends on click and on Enter once there is input", () => {
    const onSend = vi.fn();
    render(<ReplyPrompt question="Which match?" value="2" onChange={() => {}} onSend={onSend} />);

    const btn = screen.getByText("Send");
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);

    const input = screen.getByPlaceholderText("Type your answer…");
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(onSend).toHaveBeenCalledTimes(2);
  });

  it("ignores non-Enter keys", () => {
    const onSend = vi.fn();
    render(<ReplyPrompt question="Q" value="2" onChange={() => {}} onSend={onSend} />);

    const input = screen.getByPlaceholderText("Type your answer…");
    fireEvent.keyPress(input, { key: "a", code: "KeyA", charCode: 97 });

    expect(onSend).not.toHaveBeenCalled();
  });
});
