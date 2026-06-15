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
    // Initial progress setup
    fs.writeFileSync(progressFile, JSON.stringify({ percent: 0 }));

    let ytDlpPath = process.env.YT_DLP_PATH;
    if (!ytDlpPath) {
      if (process.platform === "win32") {
        ytDlpPath = fs.existsSync("C:\\yt-dlp\\yt-dlp.exe") ? "C:\\yt-dlp\\yt-dlp.exe" : "yt-dlp";
      } else {
        const bundledPath = path.join(process.cwd(), "bin", "yt-dlp");
        if (fs.existsSync(bundledPath)) {
          const tempBinaryPath = path.join("/tmp", "yt-dlp");
          try {
            const bundledStats = fs.statSync(bundledPath);
            let needsCopy = true;
            if (fs.existsSync(tempBinaryPath)) {
              const tempStats = fs.statSync(tempBinaryPath);
              if (tempStats.size === bundledStats.size) {
                needsCopy = false;
              }
            }
            if (needsCopy) {
              fs.copyFileSync(bundledPath, tempBinaryPath);
              fs.chmodSync(tempBinaryPath, "755");
            }
            ytDlpPath = tempBinaryPath;
          } catch (err) {
            console.error("Failed to copy/chmod bundled yt-dlp binary:", err);
            ytDlpPath = "yt-dlp";
          }
        } else {
          ytDlpPath = "yt-dlp";
        }
      }
    }

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
      // Match lines like "[download]  12.4% of ..."
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
      console.error("YT-DLP STDERR:", data.toString());
    });

    ytDlp.on("close", (code) => {
      // Clean up progress file
      try {
        if (fs.existsSync(progressFile)) fs.unlinkSync(progressFile);
      } catch {}

      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        resolve(new Response("Download failed", { status: 500 }));
        return;
      }

      if (!fs.existsSync(output)) {
        resolve(new Response("Video file not created", { status: 500 }));
        return;
      }

      const video = fs.readFileSync(output);

      const response = new Response(video, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": "attachment; filename=reel.mp4",
        },
      });

      // Cleanup temp output file after response is resolved
      setTimeout(() => {
        try {
          if (fs.existsSync(output)) fs.unlinkSync(output);
        } catch {}
      }, 5000);

      resolve(response);
    });
  });
}