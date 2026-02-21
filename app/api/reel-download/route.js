import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const { url } = await req.json();

  if (!url) return new Response("No URL", { status: 400 });

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const id = Date.now();
  const output = path.join(tempDir, `${id}.mp4`);

  return new Promise((resolve) => {
exec(
  `"C:\\yt-dlp\\yt-dlp.exe" --ffmpeg-location "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin" --cookies-from-browser firefox -f "bv*+ba/b" --merge-output-format mp4 "${url}" -o "${output}"`,
      (err, stdout, stderr) => {

        console.log(stdout);
        console.log(stderr);

        if (err) {
          console.error("YTDLP ERROR:", err);
          resolve(new Response("Download failed", { status: 500 }));
          return;
        }

        if (!fs.existsSync(output)) {
          resolve(new Response("Video not created", { status: 500 }));
          return;
        }

        const video = fs.readFileSync(output);

        const response = new Response(video, {
          headers: {
            "Content-Type": "video/mp4",
            "Content-Disposition": "attachment; filename=reel.mp4",
          },
        });

        setTimeout(() => {
          try {
            fs.unlinkSync(output);
          } catch {}
        }, 3000);

        resolve(response);
      }
    );
  });
}