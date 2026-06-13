import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const { url, id: reqId } = await req.json();

  if (!url) return new Response("No URL", { status: 400 });

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const fileId = reqId || Date.now();
  const output = path.join(tempDir, `${fileId}.mp4`);
  const progressFile = path.join(tempDir, `progress-${fileId}.json`);

  return new Promise((resolve) => {
    // Initial progress file
    fs.writeFileSync(progressFile, JSON.stringify({ percent: 0 }));

    // Run yt-dlp on the general social media/status URL
    const ytDlp = spawn("C:\\yt-dlp\\yt-dlp.exe", [
      "--ffmpeg-location", "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin",
      "--cookies-from-browser", "firefox",
      "-f", "bv*+ba/b",
      "--merge-output-format", "mp4",
      url,
      "-o", output
    ]);

    ytDlp.stdout.on("data", (data) => {
      const outputStr = data.toString();
      const match = outputStr.match(/\[download\]\s+(\d+(?:\.\d+)?)\%/);
      if (match) {
        const percent = parseFloat(match[1]);
        try {
          fs.writeFileSync(progressFile, JSON.stringify({ percent }));
        } catch (err) {
          // ignore write race-conditions
        }
      }
    });

    ytDlp.stderr.on("data", (data) => {
      console.error("YT-DLP STATUS STDERR:", data.toString());
    });

    ytDlp.on("close", (code) => {
      try {
        if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
      } catch {}

      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        resolve(new Response("Download failed", { status: 500 }));
        return;
      }

      if (!fs.existsSync(output)) {
        resolve(new Response("File not created", { status: 500 }));
        return;
      }

      const video = fs.readFileSync(output);

      const response = new Response(video, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": "attachment; filename=status_video.mp4",
        },
      });

      setTimeout(() => {
        try {
          if (fs.existsSync(output)) fs.unlinkSync(output);
        } catch {}
      }, 5000);

      resolve(response);
    });
  });
}
