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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    // Reset previous state
    setError("");

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
      // Step 1: Get file info
      console.log('Step 1: Getting file info...');
      const fileInfoResponse = await fetch('http://localhost:3002/api/file-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: figmaUrl,
          accessToken: tokenValue
        })
      });

      const fileInfoData = await fileInfoResponse.json();

      if (!fileInfoData.success) {
        // Check for rate limit error
        if (fileInfoResponse.status === 429 || fileInfoData.errorCode === 'RATE_LIMIT_EXCEEDED') {
          setError('⚠️ Rate limit exceeded. Please wait a few minutes before trying again. Figma allows a limited number of requests per minute.');
        } else {
          setError(fileInfoData.error || 'Failed to get file information');
        }
        setLoading(false);
        return;
      }

      console.log('File info received:', fileInfoData);

      // Step 2: Auto-analyze the first page
      if (fileInfoData.pages && fileInfoData.pages.length > 0) {
        const firstPage = fileInfoData.pages[0];
        
        console.log('Step 2: Auto-analyzing first page:', firstPage.name);

        const analysisResponse = await fetch('http://localhost:3002/api/analyse-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: figmaUrl,
            pageId: firstPage.id,
            accessToken: tokenValue
          })
        });

        const analysisData = await analysisResponse.json();

        if (analysisData.success) {
          console.log('Page analysis completed successfully:', analysisData);
          // Analysis completed - you can add success handling here if needed
        } else {
          // Check for rate limit error
          if (analysisResponse.status === 429 || analysisData.errorCode === 'RATE_LIMIT_EXCEEDED') {
            setError('⚠️ Rate limit exceeded. Please wait a few minutes before trying again. Figma allows a limited number of requests per minute.');
          } else {
            setError(analysisData.error || 'Failed to analyze page');
          }
        }
      } else {
        setError('No pages found in the Figma file');
        setLoading(false);
      }

    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };
  // Add after line 66: }; (end of handleAnalyze function)
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
            {loading && (
              <div className="linear-progress-container">
                <div className="linear-progress-bar">
                  <div className="linear-progress-fill"></div>
                </div>
                <p className="progress-text">Analyzing your Figma design...</p>
              </div>
            )}
          </div>
          {error && (
            <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
              {error}
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
