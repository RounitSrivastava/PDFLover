"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";

const FONTS_LIST = [
  { name: "Dancing Script", value: "'Dancing Script', cursive" },
  { name: "Great Vibes", value: "'Great Vibes', cursive" },
  { name: "Sacramento", value: "'Sacramento', cursive" },
  { name: "Alex Brush", value: "'Alex Brush', cursive" }
];

export default function ESignPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedPdfUrl, setSignedPdfUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // PDF.js Client-Side CDN Loader States
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [pdfRendering, setPdfRendering] = useState(false);

  // Page dimensions map: { pageIndex: { width, height } }
  const [pageDimensions, setPageDimensions] = useState({});
  const [selectedPage, setSelectedPage] = useState(0);
  const [xPercent, setXPercent] = useState(50); // 0 to 100
  const [yPercent, setYPercent] = useState(80); // 0 to 100
  const [sigScale, setSigScale] = useState(120); // Width of stamp in pixels

  // Signature Type States
  const [sigType, setSigType] = useState("draw"); // "draw" or "type"
  
  // Draw State
  const canvasRef = useRef(null);
  const canvasRefs = useRef([]); // Refs array for each page canvas element
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [sigColor, setSigColor] = useState("#000000"); // black, blue, red
  const [sigWidth, setSigWidth] = useState(3);

  // Type State
  const [typedText, setTypedText] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONTS_LIST[0].value);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Inject PDF.js CDN script on client mount
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfjsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      setPdfjsLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Parse PDF.js Doc once when file is set and PDF.js is loaded
  useEffect(() => {
    const loadPdfDoc = async () => {
      if (file && pdfjsLoaded && !pdfDoc) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          setPdfDoc(pdf);
          setPdfPageCount(pdf.numPages);
        } catch (err) {
          console.error("Error loading PDF:", err);
          setError("Failed to parse PDF document.");
        }
      }
    };
    loadPdfDoc();
  }, [file, pdfjsLoaded, pdfDoc]);

  // Render all pages in the scrollable view sequentially
  const renderAllPdfPages = async () => {
    if (!pdfDoc) return;

    setPdfRendering(true);
    setError("");
    const dims = {};

    try {
      for (let idx = 0; idx < pdfDoc.numPages; idx++) {
        const page = await pdfDoc.getPage(idx + 1);
        const viewport = page.getViewport({ scale: 1.0 });
        dims[idx] = { width: viewport.width, height: viewport.height };

        const containerWidth = 300;
        const scale = (containerWidth / viewport.width) * 2; // 2x high resolution for sharp rendering
        const scaledViewport = page.getViewport({ scale });

        // Grab current canvas reference
        const canvas = canvasRefs.current[idx];
        if (canvas) {
          const context = canvas.getContext("2d");
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
          };
          await page.render(renderContext).promise;
        }
      }
      setPageDimensions(dims);
      setPdfRendering(false);
    } catch (err) {
      console.error("Error rendering PDF pages:", err);
      setError("Failed to render PDF pages visually.");
      setPdfRendering(false);
    }
  };

  // Re-trigger layout draws when document loads and canvas references mount in DOM
  useEffect(() => {
    if (pdfDoc) {
      // Clear and adjust refs size to match numPages
      canvasRefs.current = canvasRefs.current.slice(0, pdfDoc.numPages);
      
      const timer = setTimeout(() => {
        renderAllPdfPages();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [pdfDoc]);

  // Drag & Drop
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
    setSignedPdfUrl(null);
    setPageDimensions({});
    setPdfDoc(null);
    
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setSelectedPage(0);
    setXPercent(50);
    setYPercent(80);
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

  // Canvas Drawing Pad Handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = sigWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Interactive coordinates mapping inside page containers
  const handlePageInteraction = (e, idx) => {
    setSelectedPage(idx);
    
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setXPercent(Math.round(xPct));
    setYPercent(Math.round(yPct));
  };

  const handlePageMove = (e, idx) => {
    if (e.buttons !== 1 && !e.touches) return;
    handlePageInteraction(e, idx);
  };

  // Compile Base64 Signature Image
  const getSignatureDataUrl = () => {
    if (sigType === "draw") {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL("image/png") : null;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `italic 64px ${selectedFont}`;
      ctx.fillStyle = sigColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      ctx.fillText(typedText || "Signature", canvas.width / 2, canvas.height / 2);
      return canvas.toDataURL("image/png");
    }
  };

  const hasValidSignature = () => {
    if (sigType === "draw") return hasDrawn;
    return typedText.trim().length > 0;
  };

  // Embed signature on target page index with offsets
  const handleSignPdf = async () => {
    const targetDims = pageDimensions[selectedPage];
    if (!file || !hasValidSignature() || !targetDims) return;

    setLoading(true);
    setError("");
    setSignedPdfUrl(null);

    try {
      const signaturePngDataUrl = getSignatureDataUrl();
      if (!signaturePngDataUrl) throw new Error("Could not compile signature.");

      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const sigImage = await pdfDoc.embedPng(signaturePngDataUrl);

      const pages = pdfDoc.getPages();
      const targetPage = pages[selectedPage];

      const pdfW = targetDims.width;
      const pdfH = targetDims.height;

      // Coordinate matching
      const visualContainerWidth = 300;
      const sigScaleRatio = sigScale / visualContainerWidth;
      const sigPDFWidth = sigScaleRatio * pdfW;
      const sigPDFHeight = (sigImage.height / sigImage.width) * sigPDFWidth;

      // HTML (top-left) to PDF points (bottom-left)
      const sigPDFX = (xPercent / 100) * pdfW - sigPDFWidth / 2;
      const sigPDFY = ((100 - yPercent) / 100) * pdfH - sigPDFHeight / 2;

      targetPage.drawImage(sigImage, {
        x: Math.max(0, Math.min(pdfW - sigPDFWidth, sigPDFX)),
        y: Math.max(0, Math.min(pdfH - sigPDFHeight, sigPDFY)),
        width: sigPDFWidth,
        height: sigPDFHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const localUrl = URL.createObjectURL(blob);
      
      setSignedPdfUrl(localUrl);
      setLoading(false);

      const a = document.createElement("a");
      a.href = localUrl;
      a.download = `${file.name.replace(/\.[^/.]+$/, "")}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF-Lib stamp error:", err);
      setLoading(false);
      setError("Failed to compile signed PDF document.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setError("");
    setSignedPdfUrl(null);
    setHasDrawn(false);
    setTypedText("");
    setPdfDoc(null);
    setPageDimensions({});
  };

  return (
    <div className="main">
      <div className="toolHeader">
        <h1>E-Sign PDF</h1>
        <p className="subtitle">Scroll through all pages, click anywhere on your document to preview, and stamp your signature.</p>
      </div>

      <div className="workspaceCard" style={{ maxWidth: "800px" }}>
        {error && (
          <div className="errorCard">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {!file && !loading && !signedPdfUrl && (
          <label
            className={`dropZone ${dragActive ? "dragActive" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{ width: "100%" }}
          >
            <div className="uploadIcon">✍️</div>
            <div className="dropZoneText">
              <span className="primary">Click to upload or drag & drop</span>
              <span className="secondary">Select PDF file up to 20MB</span>
            </div>
            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
            />
          </label>
        )}

        {file && !loading && !signedPdfUrl && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* File Info Bar */}
            <div className="fileDisplay" style={{ marginBottom: "0" }}>
              <div className="fileIcon">📄</div>
              <div className="fileDetails">
                <span className="fileName">{file.name}</span>
                <span className="fileSize">{formatBytes(file.size)}</span>
              </div>
              <button className="removeFileBtn" onClick={handleReset} title="Remove file">
                ✕
              </button>
            </div>

            {/* Split layout workspace */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              
              {/* Column 1: Signature Configuration */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Method selector tabs */}
                <div style={{
                  display: "flex",
                  background: "rgba(15, 23, 42, 0.04)",
                  padding: "4px",
                  borderRadius: "10px",
                  border: "1px solid rgba(15, 23, 42, 0.05)"
                }}>
                  <button
                    className="btn"
                    onClick={() => setSigType("draw")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: sigType === "draw" ? "white" : "transparent",
                      color: "var(--text-primary)",
                      boxShadow: sigType === "draw" ? "var(--shadow-sm)" : "none"
                    }}
                  >
                    ✏️ Draw Sign
                  </button>
                  <button
                    className="btn"
                    onClick={() => setSigType("type")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: sigType === "type" ? "white" : "transparent",
                      color: "var(--text-primary)",
                      boxShadow: sigType === "type" ? "var(--shadow-sm)" : "none"
                    }}
                  >
                    🔤 Type Sign
                  </button>
                </div>

                {/* Draw Signature Container */}
                {sigType === "draw" && (
                  <div className="settingsPanel" style={{ margin: 0, padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="settingsPanelTitle" style={{ margin: 0 }}>Draw Below</span>
                      <button className="btnOutline" onClick={clearSignature} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px" }}>
                        Clear
                      </button>
                    </div>

                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{
                        border: "1px solid rgba(15, 23, 42, 0.1)",
                        borderRadius: "10px",
                        background: "#ffffff",
                        cursor: "crosshair",
                        touchAction: "none",
                        width: "100%",
                        height: "140px"
                      }}
                    />
                  </div>
                )}

                {/* Type Signature Container */}
                {sigType === "type" && (
                  <div className="settingsPanel" style={{ margin: 0, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span className="settingsPanelTitle" style={{ margin: 0 }}>Type Your Full Name / Initials</span>
                    <input
                      type="text"
                      className="urlInput"
                      style={{ padding: "8px 12px", borderRadius: "8px", background: "white" }}
                      placeholder="e.g. John Doe / JD"
                      value={typedText}
                      onChange={(e) => setTypedText(e.target.value)}
                    />

                    {/* Styled Handwriting Previews */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)" }}>Choose Signature Font Style:</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {FONTS_LIST.map((font) => (
                          <div
                            key={font.name}
                            onClick={() => setSelectedFont(font.value)}
                            style={{
                              padding: "10px 4px",
                              border: selectedFont === font.value ? "2px solid #6366f1" : "1px solid rgba(0,0,0,0.08)",
                              borderRadius: "8px",
                              background: "white",
                              textAlign: "center",
                              cursor: "pointer",
                              fontFamily: font.value,
                              fontSize: "18px",
                              color: sigColor,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              transition: "0.15s ease",
                              boxShadow: selectedFont === font.value ? "var(--shadow-sm)" : "none"
                            }}
                          >
                            {typedText || font.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Settings (Color and Scale width) */}
                <div className="settingsPanel" style={{ margin: 0, padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Pen Color:</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {["#000000", "#0000ff", "#ff0000"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setSigColor(color)}
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: color,
                              border: sigColor === color ? "2px solid #6366f1" : "1px solid rgba(0,0,0,0.1)",
                              cursor: "pointer"
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>Selected Page:</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#6366f1" }}>Page {selectedPage + 1} of {pdfPageCount}</span>
                    </div>
                  </div>

                  <div className="rangeSliderGroup" style={{ gap: "4px" }}>
                    <div className="rangeSliderHeader" style={{ fontSize: "12px" }}>
                      <span>Signature Stamp Size</span>
                      <span className="value">{sigScale}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="240"
                      className="rangeInput"
                      value={sigScale}
                      onChange={(e) => setSigScale(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <button
                  className="btn btnPdf"
                  onClick={handleSignPdf}
                  disabled={!hasValidSignature() || pdfRendering}
                  style={{ marginTop: "4px" }}
                >
                  Stamp & Download PDF
                </button>
              </div>

              {/* Column 2: Aspect-ratio PDF page Placement Workspace */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Click / Touch or Drag to Position Stamp
                </span>

                {/* Scrollable Viewport Frame */}
                <div style={{
                  maxHeight: "530px",
                  overflowY: "auto",
                  padding: "16px 24px",
                  background: "rgba(15, 23, 42, 0.02)",
                  borderRadius: "16px",
                  border: "1px solid rgba(15, 23, 42, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "350px",
                  gap: "20px"
                }}>
                  {pdfRendering && Object.keys(pageDimensions).length === 0 && (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      height: "300px"
                    }}>
                      <div className="spinner" style={{ width: "24px", height: "24px" }} />
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>Loading PDF Pages...</span>
                    </div>
                  )}

                  {Array.from({ length: pdfPageCount }).map((_, idx) => {
                    const dims = pageDimensions[idx];
                    const height = dims ? (dims.height / dims.width) * 300 : 420;
                    
                    return (
                      <div
                        key={idx}
                        onMouseDown={(e) => handlePageInteraction(e, idx)}
                        onMouseMove={(e) => handlePageMove(e, idx)}
                        onTouchStart={(e) => handlePageInteraction(e, idx)}
                        onTouchMove={(e) => handlePageMove(e, idx)}
                        style={{
                          width: "300px",
                          height: `${height}px`,
                          border: selectedPage === idx 
                            ? "2px solid #6366f1" 
                            : "1.5px solid rgba(15, 23, 42, 0.12)",
                          borderRadius: "12px",
                          background: "#ffffff",
                          boxShadow: selectedPage === idx 
                            ? "0 4px 25px rgba(99, 102, 241, 0.15)" 
                            : "0 2px 10px rgba(0,0,0,0.02)",
                          position: "relative",
                          overflow: "hidden",
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "border-color 0.2s, box-shadow 0.2s"
                        }}
                      >
                        {/* The actual PDF Page rendered as background by PDF.js */}
                        <canvas
                          ref={(el) => { canvasRefs.current[idx] = el; }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none"
                          }}
                        />

                        {/* Page label badge */}
                        <span style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          fontSize: "9px",
                          fontWeight: "800",
                          color: selectedPage === idx ? "white" : "var(--text-primary)",
                          background: selectedPage === idx ? "#6366f1" : "rgba(255,255,255,0.85)",
                          padding: "2px 5px",
                          borderRadius: "4px",
                          border: "1px solid rgba(0,0,0,0.06)",
                          pointerEvents: "none",
                          boxShadow: "var(--shadow-sm)",
                          zIndex: 10
                        }}>
                          PAGE {idx + 1}
                        </span>

                        {/* Stamp Overlay (only visible on the selected page) */}
                        {hasValidSignature() && selectedPage === idx && (
                          <div
                            style={{
                              position: "absolute",
                              left: `${xPercent}%`,
                              top: `${yPercent}%`,
                              width: `${sigScale}px`,
                              transform: "translate(-50%, -50%)",
                              pointerEvents: "none",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              border: "1.5px dashed #6366f1",
                              background: "rgba(99, 102, 241, 0.08)",
                              borderRadius: "4px",
                              padding: "4px",
                              boxShadow: "0 0 10px rgba(99, 102, 241, 0.25)"
                            }}
                          >
                            {/* Anchor dot */}
                            <div style={{
                              position: "absolute",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#6366f1",
                              border: "1px solid white"
                            }} />

                            {/* Signature preview stamp */}
                            {sigType === "draw" ? (
                              <div style={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                color: sigColor,
                                textShadow: "0 1px 1px white"
                              }}>
                                ✍️ DRAWN STAMP
                              </div>
                            ) : (
                              <div style={{
                                fontFamily: selectedFont,
                                fontSize: `${Math.min(26, sigScale / 5)}px`,
                                color: sigColor,
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}>
                                {typedText || "Signature"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span>Page: {selectedPage + 1}</span>
                  <span>X: {xPercent}%</span>
                  <span>Y: {yPercent}%</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {loading && (
          <div className="loaderContainer">
            <div className="spinner"></div>
            <div className="loadingText">Applying digital signature onto document...</div>
          </div>
        )}

        {signedPdfUrl && !loading && (
          <div className="successPanel">
            <div className="successIcon">✓</div>
            <div className="successTitle">PDF Signed!</div>
            <div className="successSubtitle">Your signature has been stamped precisely onto the selected page location.</div>
            <div className="actionRow">
              <a
                href={signedPdfUrl}
                download={`${file.name.replace(/\.[^/.]+$/, "")}_signed.pdf`}
                className="btn btnPdf"
                style={{ textDecoration: "none" }}
              >
                Download Signed PDF
              </a>
              <button className="btn btnOutline" onClick={handleReset}>
                Sign Another Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
