import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DesignSystem } from "./screens/DesignSystem";
import { MainScreen } from "./screens/MainScreen";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<DesignSystem />} />
        <Route path="/main" element={<MainScreen />} />
      </Routes>
    </Router>
  </StrictMode>,
);
