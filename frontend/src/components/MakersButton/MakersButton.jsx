/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

export const MakersButton = ({
  stateProp,
  type,
  className,
  divClassName,
  text = "Button",
  onClick,
  navigateTo,
}) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, {
    state: stateProp || "default",

    type: type || "primary",
  });

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`MAKERS-BUTTON ${state.type} ${state.state} ${className}`}
      onMouseEnter={() => {
        dispatch("mouse_enter");
      }}
      onMouseLeave={() => {
        dispatch("mouse_leave");
      }}
      onClick={handleClick}
    >
      <div className={`button ${divClassName}`}>{text}</div>
    </button>
  );
};

function reducer(state, action) {
  if (state.state === "default" && state.type === "primary") {
    switch (action) {
      case "mouse_enter":
        return {
          state: "hover",

          type: "primary",
        };
    }
  }

  if (state.state === "hover" && state.type === "primary") {
    switch (action) {
      case "mouse_leave":
        return {
          state: "default",

          type: "secondary",
        };
    }
  }

  if (state.state === "default" && state.type === "secondary") {
    switch (action) {
      case "mouse_enter":
        return {
          state: "hover",

          type: "primary",
        };
    }
  }

  return state;
}

MakersButton.propTypes = {
  stateProp: PropTypes.oneOf(["hover", "default"]),
  type: PropTypes.oneOf(["primary", "secondary"]),
  text: PropTypes.string,
  onClick: PropTypes.func,
  navigateTo: PropTypes.string,
};
