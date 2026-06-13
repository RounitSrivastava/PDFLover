"use client";

import { useState } from "react";

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
    setConvertedUrl(null);
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (extension !== "docx" && extension !== "doc") {
      setError("Please select a valid Word file (.doc or .docx).");
      return;
    }

    setFile(selectedFile);
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

  const handleConvert = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setConvertedUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/word-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Conversion failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setConvertedUrl(url);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Word to PDF conversion failed. Make sure LibreOffice is running on your server.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setError("");
    setConvertedUrl(null);
  };

  return (
    <div className="main">
      <div className="toolHeader">
        <h1>Word to PDF</h1>
        <p className="subtitle">Convert Word documents (.doc, .docx) to PDF format instantly.</p>
      </div>

      <div className="workspaceCard">
        {error && (
          <div className="errorCard">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {!file && !loading && !convertedUrl && (
          <label
            className={`dropZone ${dragActive ? "dragActive" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="uploadIcon">📄</div>
            <div className="dropZoneText">
              <span className="primary">Click to upload or drag & drop</span>
              <span className="secondary">Supports .docx and .doc files up to 20MB</span>
            </div>
            <input
              hidden
              type="file"
              accept=".doc,.docx"
              onChange={handleFileInput}
            />
          </label>
        )}

        {file && !loading && !convertedUrl && (
          <div style={{ width: "100%" }}>
            <div className="fileDisplay">
              <div className="fileIcon">📄</div>
              <div className="fileDetails">
                <span className="fileName">{file.name}</span>
                <span className="fileSize">{formatBytes(file.size)}</span>
              </div>
              <button className="removeFileBtn" onClick={handleReset} title="Remove file">
                ✕
              </button>
            </div>
            <button className="btn btnPdf" onClick={handleConvert}>
              Convert to PDF
            </button>
          </div>
        )}

        {loading && (
          <div className="loaderContainer">
            <div className="spinner"></div>
            <div className="loadingText">Converting Word document to PDF...</div>
          </div>
        )}

        {convertedUrl && !loading && (
          <div className="successPanel">
            <div className="successIcon">✓</div>
            <div className="successTitle">Conversion Successful!</div>
            <div className="successSubtitle">Your PDF document is ready for download.</div>
            <div className="actionRow">
              <a
                href={convertedUrl}
                download={`${file.name.replace(/\.[^/.]+$/, "")}.pdf`}
                className="btn btnPdf"
                style={{ textDecoration: "none" }}
              >
                Download File
              </a>
              <button className="btn btnOutline" onClick={handleReset}>
                Convert Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}