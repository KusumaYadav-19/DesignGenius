import React from "react";
import { MakersBrandLogo } from "../../components/MakersBrandLogo";
import { MakersButton } from "../../components/MakersButton";
import { MakersTextContent } from "../../components/MakersTextContent";
import "./style.css";

export const DesignSystem = () => {
  return (
    <div className="design-system" data-model-id="337:579">
      <MakersTextContent
        align="left"
        className="MAKERS-TEXT-CONTENT-instance"
        text={
          <>
          AI Design Standardiser And
            <br />
          Automation
          </>
        }
        text1={
          <>
            Build Design Systems that stay consistent,
            <br />
            scalable and pixel perfect.
          </>
        }
      />
      <MakersButton
        className="MAKERS-BUTTON-instance"
        divClassName="design-component-instance-node"
        stateProp="default"
        text="Try Now"
        type="secondary"
        navigateTo="/main"
      />
      <div className="MAKERS-NAVIGATION">
        <div className="container">
          <div className="left">
            <MakersBrandLogo
              className="MAKERS-BRAND-LOGO-instance"
              rectangleClassName="MAKERS-BRAND-LOGO-2"
              rectangleClassNameOverride="MAKERS-BRAND-LOGO-2"
              type="logo"
            />
          </div>
        </div>
      </div>

      <div className="image">
        <img className="img" alt="Rectangle" src="/img/rectangle-281.png" />

        <div className="text-wrapper-3">Scan.Detect.Refine</div>

        <div className="design-system-audit">
          Design System Audit
          <br />
          and Governance
        </div>
      </div>
    </div>
  );
};
