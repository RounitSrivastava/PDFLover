"use client";

import { useState } from "react";

export default function StatusDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

  const validateUrl = (testUrl) => {
    if (!testUrl) return "Please paste a video or status link.";
    if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
      return "Please enter a valid URL (must start with http:// or https://)";
    }
    return null;
  };

  const handleDownload = async () => {
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setDownloadUrl(null);
    setProgress(0);

    const reqId = Date.now();
    
    // Poll progress every 400ms
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/download-progress?id=${reqId}`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.percent || 0);
        }
      } catch (err) {
        // ignore polling errors silently
      }
    }, 400);

    try {
      const res = await fetch("/api/status-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, id: reqId }),
      });

      clearInterval(intervalId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Download failed");
      }

      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setDownloadUrl(localUrl);
      setProgress(100);

      // Auto-trigger download
      const a = document.createElement("a");
      a.href = localUrl;
      a.download = `downloaded_status_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setLoading(false);
    } catch (err) {
      clearInterval(intervalId);
      console.error(err);
      setLoading(false);
      setError(err.message || "Failed to download. Please try again.");
    }
  };

  const handleReset = () => {
    setUrl("");
    setError("");
    setProgress(0);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  return (
    <div className="main">
      <div className="toolHeader">
        <h1>Status Downloader</h1>
        <p className="subtitle">Download statuses and videos from WhatsApp, TikTok, Twitter, and Facebook.</p>
      </div>

      <div className="workspaceCard">
        {error && (
          <div className="errorCard" style={{ color: "#f43f5e", borderColor: "rgba(244, 63, 94, 0.2)", background: "rgba(244, 63, 94, 0.05)" }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {!loading && !downloadUrl && (
          <div style={{ width: "100%" }}>
            <div className="urlInputContainer">
              <label className="urlInputLabel">Video or Status Link</label>
              <input
                type="text"
                className="urlInput"
                placeholder="Paste link here (e.g. WhatsApp, TikTok, Twitter...)"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
            
            <button className="btn btnMedia" onClick={handleDownload}>
              Download Status Media
            </button>
          </div>
        )}

        {loading && (
          <div className="loaderContainer" style={{ width: "100%" }}>
            <div className="spinner spinnerMedia"></div>
            <div className="loadingText">
              {progress > 0 ? `Downloading media stream: ${progress}%` : "Initiating connection to host..."}
            </div>
            
            {/* Progress Bar Container */}
            <div style={{
              width: "100%",
              height: "8px",
              background: "rgba(15, 23, 42, 0.06)",
              borderRadius: "4px",
              overflow: "hidden",
              marginTop: "8px"
            }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--grad-media)",
                borderRadius: "4px",
                transition: "width 0.25s linear"
              }}></div>
            </div>
          </div>
        )}

        {downloadUrl && !loading && (
          <div className="successPanel" style={{ border: "1px solid rgba(244, 63, 94, 0.2)", background: "rgba(244, 63, 94, 0.03)" }}>
            <div className="successIcon" style={{ color: "#f43f5e" }}>✓</div>
            <div className="successTitle">Media Downloaded!</div>
            <div className="successSubtitle">Your status video file has been successfully downloaded.</div>
            <div className="actionRow">
              <a
                href={downloadUrl}
                download={`downloaded_status_${Date.now()}.mp4`}
                className="btn btnMedia"
                style={{ textDecoration: "none" }}
              >
                Download MP4
              </a>
              <button className="btn btnOutline" onClick={handleReset}>
                Clear / Download New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
