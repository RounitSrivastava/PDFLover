import fs from "fs";
import path from "path";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");

  if (!file) return new Response("No file", { status: 400 });

  // Forward the file to the Railway/Render backend
  const backendUrl = process.env.CONVERTER_BACKEND_URL;
  if (!backendUrl) {
    return new Response("CONVERTER_BACKEND_URL is not set", { status: 500 });
  }

  // Re-build FormData to forward to backend
  const forwardForm = new FormData();
  forwardForm.append("file", file);

  let backendRes;
  try {
    backendRes = await fetch(`${backendUrl}/convert/pdf-to-word`, {
      method: "POST",
      body: forwardForm,
    });
  } catch (err) {
    console.error("Backend request failed:", err);
    return new Response("Could not reach conversion backend", { status: 502 });
  }

  if (!backendRes.ok) {
    const errText = await backendRes.text().catch(() => "unknown error");
    console.error("Backend error:", errText);
    return new Response("Conversion failed", { status: 500 });
  }

  // Stream the DOCX response back to the browser
  const docxBuffer = await backendRes.arrayBuffer();

  return new Response(docxBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=converted.docx",
    },
  });
}