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

  const doc = path.join(tempDir, `${id}.docx`);
  const pdf = path.join(tempDir, `${id}.pdf`);

  fs.writeFileSync(doc, buffer);

  return new Promise((resolve) => {
    exec(
      `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf "${doc}" --outdir "${tempDir}"`,
      (err) => {
        if (err) {
          console.error(err);
          resolve(new Response("Conversion failed", { status: 500 }));
          return;
        }

        if (!fs.existsSync(pdf)) {
          resolve(new Response("PDF not created", { status: 500 }));
          return;
        }

        const output = fs.readFileSync(pdf);

        const response = new Response(output, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=converted.pdf",
          },
        });

        setTimeout(() => {
          try {
            fs.unlinkSync(doc);
            fs.unlinkSync(pdf);
          } catch {}
        }, 3000);

        resolve(response);
      }
    );
  });
}