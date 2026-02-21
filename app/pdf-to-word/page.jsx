"use client";

import { useState } from "react";

export default function PdfToWord() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error();

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.docx";
      document.body.appendChild(a);
      a.click();

      a.remove();
      URL.revokeObjectURL(url);

      setLoading(false);

    } catch {
      setLoading(false);
      setError("PDF to Word conversion failed.");
    }
  };

  return (
    <div className="main">
      <h1>PDF to Word</h1>

      <p className="subtitle">
        Convert PDF files to editable Word documents.
      </p>

      <label className="uploadBtn">
        Select PDF File
        <input
          hidden
          type="file"
          accept="application/pdf"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </label>

      {loading && <p className="subtitle">Converting… ⏳</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}