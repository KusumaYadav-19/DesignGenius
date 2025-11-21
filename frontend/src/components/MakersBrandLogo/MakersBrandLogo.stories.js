import { MakersBrandLogo } from ".";

export default {
  title: "Components/MakersBrandLogo",
  component: MakersBrandLogo,

  argTypes: {
    type: {
      options: ["logo"],
      control: { type: "select" },
    },
  },
};

export const Default = {
  args: {
    type: "logo",
    className: {},
    rectangleClassName: {},
    rectangleClassNameOverride: {},
  },
};
