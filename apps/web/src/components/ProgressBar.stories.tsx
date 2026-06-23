import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "Scanner/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Initial: Story = {
  args: {
    progress: 0,
    label: "Initializing...",
  },
};

export const InProgress: Story = {
  args: {
    progress: 45,
    label: "Downloading track...",
  },
};

export const Complete: Story = {
  args: {
    progress: 100,
    label: "Extraction complete!",
  },
};
