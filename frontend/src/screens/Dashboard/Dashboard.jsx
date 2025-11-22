import React from "react";
import { MakersBrandLogo } from "../../components/MakersBrandLogo";
import "./Dashboard.css";

export const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-navigation">
        <div className="dashboard-container">
          <div className="dashboard-left">
            <MakersBrandLogo
              className="dashboard-component-instance"
              rectangleClassName="dashboard-brand-logo-instance"
              rectangleClassNameOverride="dashboard-brand-logo-2"
              type="logo"
            />
          </div>
        </div>
      </div>

      {/* Empty content area for future development */}
      <div className="dashboard-content">
        <div className="dashboard-placeholder">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Coming Soon...</p>
        </div>
      </div>
    </div>
  );
};
