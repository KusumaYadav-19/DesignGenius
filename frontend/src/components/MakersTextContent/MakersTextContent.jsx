/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import "./style.css";

export const MakersTextContent = ({
  align,
  className,
  text = "Learn how to make and publish sites with Figma",
  text1 = "Makers is a Figma Plugin to help you build and publish sites directly in Figma. No code required.",
}) => {
  return (
    <div className={`MAKERS-TEXT-CONTENT ${className}`}>
      <div className="text-wrapper"></div>

      <p className="learn-how-to-make">{text}</p>

      <p className="makers-is-a-figma">{text1}</p>
    </div>
  );
};

MakersTextContent.propTypes = {
  align: PropTypes.oneOf(["left"]),
  text: PropTypes.string,
  text1: PropTypes.string,
};
