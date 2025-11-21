/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import "./style.css";
import logo from "../../assets/logo/logo.png"; // Added import

export const MakersBrandLogo = ({
  type,
  className,
  rectangleClassName,
  rectangleClassNameOverride,
}) => {
  return (
    <div className={`MAKERS-BRAND-LOGO ${className}`}>
      <div className="making-it-logo">
        <div className="text-wrapper-2">
          <img src={logo} alt="DesignGenius Logo" style={{width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle'}} />
          DesignGenius
        </div>
      </div>
    </div>
  );
};

MakersBrandLogo.propTypes = {
  type: PropTypes.oneOf(["DesignGenius"]),
};