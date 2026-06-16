const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow your Vercel frontend. Set ALLOWED_ORIGIN env var in Railway/Render.
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));

// ── Multer (memory storage — no disk needed for upload) ───────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── PDF → DOCX ────────────────────────────────────────────────────────────────
app.post("/convert/pdf-to-word", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const id = Date.now();
  const tempDir = os.tmpdir();
  const pdfPath = path.join(tempDir, `${id}.pdf`);
  const docxPath = path.join(tempDir, `${id}.docx`);

  // Write uploaded PDF to temp
  fs.writeFileSync(pdfPath, req.file.buffer);

  // Use pdf2docx (Python) for much better layout preservation
  const pythonPath = "/opt/venv/bin/python3";
  const scriptPath = path.join(__dirname, "convert.py");

  const cmd = `${pythonPath} "${scriptPath}" "${pdfPath}" "${docxPath}"`;

  exec(cmd, { timeout: 180000 }, (err, stdout, stderr) => {
    // Cleanup input PDF
    try { fs.unlinkSync(pdfPath); } catch {}

    if (err) {
      console.error("pdf2docx error:", err.message);
      console.error("stderr:", stderr);
      return res.status(500).json({ error: "Conversion failed", details: stderr });
    }

    if (!fs.existsSync(docxPath)) {
      console.error("DOCX not created. stdout:", stdout);
      return res.status(500).json({ error: "Output file not created" });
    }

    // Stream the DOCX back to the client
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=converted.docx");

    const stream = fs.createReadStream(docxPath);
    stream.pipe(res);

    stream.on("end", () => {
      setTimeout(() => { try { fs.unlinkSync(docxPath); } catch {} }, 3000);
    });

    stream.on("error", (streamErr) => {
      console.error("Stream error:", streamErr);
      try { fs.unlinkSync(docxPath); } catch {}
    });
  });
});

// ── DOCX → PDF ────────────────────────────────────────────────────────────────
app.post("/convert/word-to-pdf", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const id = Date.now();
  const tempDir = os.tmpdir();
  const docxPath = path.join(tempDir, `${id}.docx`);
  const pdfPath = path.join(tempDir, `${id}.pdf`);

  fs.writeFileSync(docxPath, req.file.buffer);

  const sofficePath = process.env.SOFFICE_PATH || "soffice";
  const cmd = `${sofficePath} --headless --convert-to pdf "${docxPath}" --outdir "${tempDir}"`;

  exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
    try { fs.unlinkSync(docxPath); } catch {}

    if (err) {
      console.error("LibreOffice error:", err.message);
      return res.status(500).json({ error: "Conversion failed", details: stderr });
    }

    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ error: "Output file not created" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");

    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
    stream.on("end", () => {
      setTimeout(() => { try { fs.unlinkSync(pdfPath); } catch {} }, 3000);
    });
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`PDF converter backend running on port ${PORT}`);
});
