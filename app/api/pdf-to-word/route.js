import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");

  if (!file) return new Response("No file", { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const id = Date.now();

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const pdf = path.join(tempDir, `${id}.pdf`);
  const docx = path.join(tempDir, `${id}.docx`);

  fs.writeFileSync(pdf, buffer);

  return new Promise((resolve) => {
    const helperScript = path.join(process.cwd(), "app", "api", "pdf-to-word", "convert.py");
    const pythonPath = process.env.PYTHON_PATH || "python";
    const quotedPythonPath = (pythonPath.includes(" ") && !pythonPath.startsWith('"')) ? `"${pythonPath}"` : pythonPath;

    exec(
      `${quotedPythonPath} "${helperScript}" "${pdf}" "${docx}"`,
      (err, stdout, stderr) => {
        if (err) {
          console.error("Conversion execution error:", err);
          console.error("stdout:", stdout);
          console.error("stderr:", stderr);
          resolve(new Response("Conversion failed", { status: 500 }));
          return;
        }

        if (!fs.existsSync(docx)) {
          resolve(new Response("DOCX not created", { status: 500 }));
          return;
        }

        const output = fs.readFileSync(docx);

        const response = new Response(output, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": "attachment; filename=converted.docx",
          },
        });

        setTimeout(() => {
          try {
            fs.unlinkSync(pdf);
            fs.unlinkSync(docx);
          } catch {}
        }, 3000);

        resolve(response);
      }
    );
  });
}