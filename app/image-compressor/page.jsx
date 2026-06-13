"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";

export default function ImageCompressor() {
  const [file, setFile] = useState(null); // original File object
  const [originalUrl, setOriginalUrl] = useState(null); // original thumbnail preview url
  const [compressedUrl, setCompressedUrl] = useState(null); // compressed url
  const [compressedSize, setCompressedSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Settings states
  const [quality, setQuality] = useState(80); // 10% to 100%
  const [maxWidth, setMaxWidth] = useState(1920); // 400px to 3840px

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError("");
    setCompressedUrl(null);
    setCompressedSize(0);
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    setFile(selectedFile);
    setOriginalUrl(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const options = {
        maxSizeMB: (file.size / (1024 * 1024)) * (quality / 100), // scale down size target
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        initialQuality: quality / 100,
      };

      const compressedFile = await imageCompression(file, options);
      
      setCompressedSize(compressedFile.size);
      setCompressedUrl(URL.createObjectURL(compressedFile));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Failed to compress image. Try adjusting the settings.");
    }
  };

  const handleReset = () => {
    setFile(null);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setOriginalUrl(null);
    setCompressedUrl(null);
    setCompressedSize(0);
    setError("");
  };

  const savedPercent = file && compressedSize 
    ? Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100))
    : 0;

  return (
    <div className="main">
      <div className="toolHeader">
        <h1>Image Compressor</h1>
        <p className="subtitle">Reduce file sizes of JPG, PNG, and WebP images while keeping high quality.</p>
      </div>

      <div className="workspaceCard">
        {error && (
          <div className="errorCard">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {!file && !loading && !compressedUrl && (
          <label
            className={`dropZone imageZone ${dragActive ? "dragActive" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="uploadIcon" style={{ color: "#22d3ee" }}>🖼️</div>
            <div className="dropZoneText">
              <span className="primary">Click to upload or drag & drop</span>
              <span className="secondary">Supports PNG, JPG, WebP images</span>
            </div>
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleFileInput}
            />
          </label>
        )}

        {file && !loading && !compressedUrl && (
          <div style={{ width: "100%" }}>
            <div className="fileDisplay">
              {originalUrl && (
                <img
                  src={originalUrl}
                  alt="preview"
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              )}
              <div className="fileDetails">
                <span className="fileName">{file.name}</span>
                <span className="fileSize">{formatBytes(file.size)}</span>
              </div>
              <button className="removeFileBtn" onClick={handleReset} title="Remove image">
                ✕
              </button>
            </div>

            <div className="settingsPanel">
              <div className="settingsPanelTitle">Compression Settings</div>
              
              <div className="rangeSliderGroup">
                <div className="rangeSliderHeader">
                  <span>Image Quality</span>
                  <span className="value">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  className="rangeInput"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              </div>

              <div className="rangeSliderGroup">
                <div className="rangeSliderHeader">
                  <span>Max Width / Height</span>
                  <span className="value">{maxWidth}px</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="3840"
                  step="80"
                  className="rangeInput"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Number(e.target.value))}
                />
              </div>
            </div>

            <button className="btn btnImage" onClick={handleCompress}>
              Compress Image
            </button>
          </div>
        )}

        {loading && (
          <div className="loaderContainer">
            <div className="spinner spinnerImage"></div>
            <div className="loadingText">Compressing image files locally...</div>
          </div>
        )}

        {compressedUrl && !loading && (
          <div className="successPanel" style={{ border: "1px solid rgba(6, 182, 212, 0.2)", background: "rgba(6, 182, 212, 0.03)" }}>
            <div className="successIcon" style={{ color: "#06b6d4" }}>✓</div>
            <div className="successTitle">Compression Completed!</div>
            
            <div className="metricsRow">
              <div className="metricItem">
                <div className="metricLabel">Original</div>
                <div className="metricValue">{formatBytes(file.size)}</div>
              </div>
              <div className="metricItem">
                <div className="metricLabel">Compressed</div>
                <div className="metricValue">{formatBytes(compressedSize)}</div>
              </div>
              <div className="metricItem">
                <div className="metricLabel">Saved</div>
                <div className="metricValue metricSaved">{savedPercent}%</div>
              </div>
            </div>

            <div className="actionRow" style={{ marginTop: "16px" }}>
              <a
                href={compressedUrl}
                download={`compressed_${file.name}`}
                className="btn btnImage"
                style={{ textDecoration: "none" }}
              >
                Download Compressed
              </a>
              <button className="btn btnOutline" onClick={handleReset}>
                Compress Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}