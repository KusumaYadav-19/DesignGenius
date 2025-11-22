import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MakersBrandLogo } from "../../components/MakersBrandLogo";
import "./Dashboard.css";

const BACKEND_URL = 'http://localhost:3002';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFiles, setSessionFiles] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/sessions`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = async (sessionId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/files`);
      const data = await response.json();
      
      if (data.success) {
        setSessionFiles(data.files);
        setSelectedSession(sessionId);
        setViewingFile(null);
        setFileContent("");
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Error fetching files:', err);
    }
  };

  const handleFileClick = async (fileName) => {
    if (!selectedSession || !fileName) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${selectedSession}/files/${fileName}`);
      const data = await response.json();
      
      if (data.success) {
        setFileContent(data.content);
        setViewingFile(fileName);
      } else {
        setError(data.error || 'Failed to fetch file content');
      }
    } catch (err) {
      setError('Failed to fetch file content');
      console.error('Error fetching file content:', err);
    }
  };

  const handleDownload = async (fileName) => {
    if (!selectedSession || !fileName) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions/${selectedSession}/files/${fileName}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/\.(json|md)$/, '.doc');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
      console.error('Error downloading file:', err);
    }
  };

  const getFileDisplayName = (fileName) => {
    const names = {
      'accessibility-report.json': 'Accessibility Report',
      'analysis-results.json': 'Analysis Results',
      'DesignKit.md': 'Design Kit',
      'SOP.md': 'SOP',
    };
    return names[fileName] || fileName;
  };

  const formatFileContent = (content, fileName) => {
    if (fileName.endsWith('.json')) {
      try {
        const json = JSON.parse(content);
        return JSON.stringify(json, null, 2);
      } catch {
        return content;
      }
    }
    // For markdown files, remove markdown formatting for cleaner display
    if (fileName.endsWith('.md')) {
      return content
        .replace(/^#+\s*/gm, '') // Remove # headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
        .replace(/^-\s+/gm, '') // Remove - bullets
        .replace(/```[\s\S]*?```/g, (match) => {
          // Remove code blocks but keep content
          return match.replace(/```/g, '').trim();
        })
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/^---+\s*$/gm, '') // Remove horizontal rules
        .replace(/\*Generated on[^\n]*/gi, '')
        .replace(/\*This document should be reviewed[^\n]*/gi, '')
        .trim();
    }
    return content;
  };

  // Function to get display name for session with numbering
  const getSessionDisplayName = (session, index) => {
    // Number sessions sequentially: Design 1, Design 2, Design 3, etc.
    // Sessions are sorted newest first, so newest gets "Design 1"
    const sessionNumber = index + 1;
    return `Design ${sessionNumber}`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-navigation">
        <div className="dashboard-container">
          <div className="dashboard-left">
            <button 
              className="dashboard-back-button"
              onClick={() => navigate("/main")}
            >
              ←
            </button>
            <MakersBrandLogo
              className="dashboard-component-instance"
              rectangleClassName="dashboard-brand-logo-instance"
              rectangleClassNameOverride="dashboard-brand-logo-2"
              type="logo"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="dashboard-placeholder">
            <h1 className="dashboard-title">Loading...</h1>
            <p className="dashboard-subtitle">Fetching analysis sessions</p>
          </div>
        ) : error ? (
          <div className="dashboard-placeholder">
            <h1 className="dashboard-title">Error</h1>
            <p className="dashboard-subtitle">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="dashboard-placeholder">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">No analysis sessions found</p>
          </div>
        ) : (
          <div className="dashboard-main-content">
            {!selectedSession ? (
              <>
                <div className="dashboard-header">
                  <h3 className="dashboard-title">Overview</h3>
                </div>
                <div className="dashboard-sessions-grid">
                  {sessions.map((session, index) => (
                    <div
                      key={session.sessionId}
                      className="dashboard-session-card"
                      onClick={() => handleSessionClick(session.sessionId)}
                    >
                      <div className="session-card-content">
                        <h3 className="session-number">
                          {getSessionDisplayName(session, index)}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="dashboard-files-view">
                <div className="files-view-header">
                  <h2 className="files-view-title">
                    {(() => {
                      const selectedSessionData = sessions.find(s => s.sessionId === selectedSession);
                      if (selectedSessionData) {
                        const index = sessions.findIndex(s => s.sessionId === selectedSession);
                        return getSessionDisplayName(selectedSessionData, index);
                      }
                      return selectedSession;
                    })()}
                  </h2>
                </div>
                
                {sessionFiles && (
                  <div className="dashboard-files-grid">
                    {Object.entries(sessionFiles).map(([key, fileName]) => {
                      if (!fileName) return null;
                      return (
                        <div key={key} className="dashboard-file-card">
                          <div className="file-card-header">
                            <h4>{getFileDisplayName(fileName)}</h4>
                          </div>
                          <div className="file-card-actions">
                            <button
                              className="view-file-btn"
                              onClick={() => handleFileClick(fileName)}
                            >
                              {viewingFile === fileName ? 'Hide' : 'Review'}
                            </button>
                            <button
                              className="download-file-btn"
                              onClick={() => handleDownload(fileName)}
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewingFile && fileContent && (
                  <div className="dashboard-file-viewer">
                    <div className="file-viewer-header">
                      <h3>{getFileDisplayName(viewingFile)}</h3>
                      <button
                        className="close-viewer-btn"
                        onClick={() => {
                          setViewingFile(null);
                          setFileContent("");
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="file-viewer-content">
                      <pre>{formatFileContent(fileContent, viewingFile)}</pre>
                    </div>
                    <div className="file-viewer-footer">
                      <button
                        className="download-viewer-btn"
                        onClick={() => handleDownload(viewingFile)}
                      >
                        Download as .doc
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

