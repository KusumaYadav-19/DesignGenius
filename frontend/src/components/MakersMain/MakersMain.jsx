import PropTypes from "prop-types";
import React, { useState } from "react";
import "./MakersMain.css";

export const MakersMain = ({
  className,
  MAKERSButtonText = "Upload Button",
  MAKERSTextContentDivClassName,
  MAKERSTextContentText = "",
  MAKERSTextContentText1 = "Upload Media",
  MAKERSTextContentText2 = "",
  layout = "centered",
}) => {
  const [tokenValue, setTokenValue] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleAnalyze = async () => {
    // Reset previous state
    setError("");
    setPages([]);
    setSelectedPage("");

    // Validation
    if (!figmaUrl.trim()) {
      setError("Please enter a Figma URL");
      return;
    }
    if (!tokenValue.trim()) {
      setError("Please enter an access token");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/file-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: figmaUrl,
          accessToken: tokenValue
        })
      });

      const data = await response.json();

      if (data.success) {
        setPages(data.pages);
        console.log('File info received:', data);
      } else {
        setError(data.error || 'Failed to get file information');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };
  // Add after line 66: }; (end of handleAnalyze function)
  const handleAnalyzePage = async () => {
    if (!selectedPage) {
      setError("Please select a page to analyze");
      return;
    }

    setAnalysisLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:3002/api/analyse-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: figmaUrl,
          pageId: selectedPage,
          accessToken: tokenValue
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data);
        console.log('Page analysis received:', data);
      } else {
        setError(data.error || 'Failed to analyze page');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('Analysis API Error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };
  return (
    <div className={`makers-main ${layout} ${className}`}>
      <div className="makers-main-content">
        <h2 className={`makers-main-title ${MAKERSTextContentDivClassName}`}>
          Turn Designs into<br />
          Production-Ready Systems
        </h2>

        <div className="makers-main-form">
          <div className="form-section">
            <label className="form-label">{MAKERSTextContentText2}</label>
            <input
              type="text"
              className="form-input"
              placeholder="Figma URL"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="form-label">{MAKERSTextContentText}</label>
            <div className="token-input-container">
              <input
                type={tokenValue && !showToken ? "password" : "text"}
                className="form-input token-input"
                placeholder="Access Token"
                value={tokenValue}
                onChange={(e) => setTokenValue(e.target.value)}
              />
              {tokenValue && (
                <button
                  type="button"
                  className="toggle-token-visibility"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? "👁️" : "🙈"}
                </button>
              )}
            </div>
          </div>

          <div className="form-section">
            <button
              className="upload-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : MAKERSButtonText}
            </button>
          </div>
          {error && (
            <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
              {error}
            </div>
          )}

          {pages.length > 0 && (
            <div className="form-section" style={{ marginTop: '20px' }}>
              <label className="form-label">Select Page to Analyze:</label>
              <select
                className="form-input"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
              >
                <option value="">Choose a page...</option>
                {pages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
                  {selectedPage && (
                <button 
                  className="upload-button" 
                  style={{marginTop: '10px'}}
                  onClick={handleAnalyzePage}
                  disabled={analysisLoading}
                >
                  {analysisLoading ? 'Analyzing Page...' : 'Analyze Selected Page'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MakersMain.propTypes = {
  className: PropTypes.string,
  MAKERSButtonText: PropTypes.string,
  MAKERSTextContentDivClassName: PropTypes.string,
  MAKERSTextContentText: PropTypes.string,
  MAKERSTextContentText1: PropTypes.string,
  MAKERSTextContentText2: PropTypes.string,
  layout: PropTypes.oneOf(["centered", "left", "right"]),
};
