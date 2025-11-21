import { MakersButton } from ".";

export default {
  title: "Components/MakersButton",
  component: MakersButton,

  argTypes: {
    stateProp: {
      options: ["hover", "default"],
      control: { type: "select" },
    },
    type: {
      options: ["primary", "secondary"],
      control: { type: "select" },
    },
  },
};

export const Default = {
  args: {
    stateProp: "hover",
    type: "primary",
    className: {},
    divClassName: {},
    text: "Button",
  },
};
