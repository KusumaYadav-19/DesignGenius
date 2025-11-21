import React from "react";
import { MakersBrandLogo } from "../../components/MakersBrandLogo";
import { MakersButton } from "../../components/MakersButton";
import { MakersMain } from "../../components/MakersMain";
import "./mainScreen.css";

export const MainScreen = () => {
    return (
        <div className="main-screen">
            <div className="main-screen-navigation">
                <div className="main-screen-container">
                    <div className="main-screen-left">
                        <MakersBrandLogo
                            className="main-screen-component-instance"
                            rectangleClassName="main-screen-brand-logo-instance"
                            rectangleClassNameOverride="main-screen-brand-logo-2"
                            type="logo"
                        />
                    </div>

                    <div className="main-screen-right">
                        <MakersButton
                            className="main-screen-component-instance"
                            stateProp="default"
                            text="Dashboard"
                            type="primary"
                        />
                    </div>
                </div>
            </div>

            <MakersMain
                MAKERSButtonText="Analyze"
                MAKERSTextContentDivClassName="main-screen-main-text"
                // MAKERSTextContentText="Tokens"
                MAKERSTextContentText1="Turn Designs into \n Production-Ready Systems"
                // MAKERSTextContentText2="URL"
                className="main-screen-main-instance"
                layout="centered"
            />
        </div>
    );
};