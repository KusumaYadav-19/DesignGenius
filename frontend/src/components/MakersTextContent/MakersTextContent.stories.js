import { MakersTextContent } from ".";

export default {
  title: "Components/MakersTextContent",
  component: MakersTextContent,

  argTypes: {
    align: {
      options: ["left"],
      control: { type: "select" },
    },
  },
};

export const Default = {
  args: {
    align: "left",
    className: {},
    text: "Learn how to make and publish sites with Figma",
    text1:
      "Makers is a Figma Plugin to help you build and publish sites directly in Figma. No code required.",
  },
};
