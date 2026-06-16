import fs from "fs";
import path from "path";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return new Response(JSON.stringify({ error: "Missing id parameter" }), { 
    status: 400,
    headers: { "Content-Type": "application/json" }
  });

  const tempDir = process.platform === "win32"
    ? path.join(process.cwd(), "temp")
    : "/tmp";
  const progressFile = path.join(tempDir, `progress-${id}.json`);

  if (!fs.existsSync(progressFile)) {
    return new Response(JSON.stringify({ percent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const data = fs.readFileSync(progressFile, "utf-8");
    const json = JSON.parse(data);
    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error reading progress file:", err);
    return new Response(JSON.stringify({ percent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
