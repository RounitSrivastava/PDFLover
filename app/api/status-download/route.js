import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { resolveYtDlpPath } from "../yt-dlp-helper.js";

// Extend Vercel serverless function timeout to 60 seconds
export const maxDuration = 60;

export async function POST(req) {
  const { url, id: reqId } = await req.json();

  if (!url) return new Response("No URL", { status: 400 });

  // On Vercel/Linux, only /tmp is writable. Use /tmp on Linux, local temp/ on Windows.
  const tempDir = process.platform === "win32"
    ? path.join(process.cwd(), "temp")
    : "/tmp";
  if (process.platform === "win32" && !fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const fileId = reqId || Date.now();
  const output = path.join(tempDir, `${fileId}.mp4`);
  const progressFile = path.join(tempDir, `progress-${fileId}.json`);

  const ytDlpPath = await resolveYtDlpPath();
  console.log("Using yt-dlp at:", ytDlpPath);

  return new Promise((resolve) => {
    // Initial progress file
    fs.writeFileSync(progressFile, JSON.stringify({ percent: 0 }));

    // Run yt-dlp on the general social media/status URL
    const ffmpegLocation = process.env.FFMPEG_PATH || (process.platform === "win32" && fs.existsSync("C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin") ? "C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin" : "");

    const ytDlpArgs = [];
    if (ffmpegLocation) {
      ytDlpArgs.push("--ffmpeg-location", ffmpegLocation);
      ytDlpArgs.push("-f", "bv*+ba/b", "--merge-output-format", "mp4");
    } else {
      ytDlpArgs.push("-f", "best[ext=mp4]/best");
    }

    if (process.env.YT_DLP_COOKIES_FILE) {
      ytDlpArgs.push("--cookies", process.env.YT_DLP_COOKIES_FILE);
    } else if (process.env.YT_DLP_COOKIES_BROWSER) {
      ytDlpArgs.push("--cookies-from-browser", process.env.YT_DLP_COOKIES_BROWSER);
    } else if (process.platform === "win32") {
      ytDlpArgs.push("--cookies-from-browser", "firefox");
    }

    ytDlpArgs.push(url, "-o", output);

    const ytDlp = spawn(ytDlpPath, ytDlpArgs);

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

    ytDlp.on("error", (err) => {
      console.error("YT-DLP STATUS SPAWN ERROR:", err);
      try {
        if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
      } catch {}
      resolve(new Response(`Failed to start download process: ${err.message}`, { status: 500 }));
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
