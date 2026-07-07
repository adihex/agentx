/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it("renders with the correct progress and label", () => {
    render(<ProgressBar progress={45} label="Scanning..." />);

    expect(screen.getByText("Scanning...")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "45");
  });

  it("updates width based on progress prop", () => {
    const { rerender } = render(<ProgressBar progress={10} />);
    let progressbar = screen.getByRole("progressbar");
    expect(progressbar.style.width).toBe("10%");

    rerender(<ProgressBar progress={80} />);
    progressbar = screen.getByRole("progressbar");
    expect(progressbar.style.width).toBe("80%");
  });
});
