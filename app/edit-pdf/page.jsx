"use client";

import { useState } from "react";

export default function EditPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEditPdf = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "editable.docx";
      document.body.appendChild(a);
      a.click();

      a.remove();
      URL.revokeObjectURL(url);

      setLoading(false);

    } catch {
      setLoading(false);
      setError("Failed to prepare editable file.");
    }
  };

  return (
    <div className="main">
      <h1>Edit PDF</h1>

      <p className="subtitle">
        Convert your PDF to an editable Word document.
      </p>

      <label className="uploadBtn">
        Select PDF File
        <input
          hidden
          type="file"
          accept="application/pdf"
          onChange={(e) => handleEditPdf(e.target.files[0])}
        />
      </label>

      {loading && <p className="subtitle">Preparing editable file… ⏳</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}