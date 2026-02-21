"use client";

import { useState } from "react";

export default function ReelDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    if (!url) {
      setError("Please paste a reel link.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reel-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "reel.mp4";
      document.body.appendChild(a);
      a.click();

      a.remove();
      URL.revokeObjectURL(downloadUrl);

      setLoading(false);

    } catch {
      setLoading(false);
      setError("Failed to download reel.");
    }
  };

  return (
    <div className="main">
      <h1>Reel Downloader</h1>

      <p className="subtitle">
        Paste a reel link and download the video.
      </p>

      <input
        style={{
          padding: "12px",
          width: "320px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "20px",
        }}
        placeholder="Paste reel link here"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <br />

      <button className="uploadBtn" onClick={handleDownload}>
        Download Reel
      </button>

      {loading && <p className="subtitle">Downloading… ⏳</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}