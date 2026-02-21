"use client";

import { useState } from "react";

export default function WordToPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/word-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Conversion failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.pdf";
      document.body.appendChild(a);
      a.click();

      a.remove();
      URL.revokeObjectURL(url);

      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Word to PDF conversion failed.");
    }
  };

  return (
    <div className="main">
      <h1>Word to PDF</h1>

      <p className="subtitle">
        Convert Word documents to PDF instantly.
      </p>

      <label className="uploadBtn">
        Select Word File
        <input
          hidden
          type="file"
          accept=".doc,.docx"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </label>

      {loading && <p className="subtitle">Converting… ⏳</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}