import fs from "fs";
import https from "https";
import path from "path";

const TMP_PATH = "/tmp/yt-dlp";
const COOKIES_PATH = "/tmp/cookies.txt";
const GITHUB_URL =
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";

/**
 * Downloads a file from a URL to a destination path, following redirects.
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function request(u) {
      https
        .get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close();
            return request(res.headers.location);
          }
          if (res.statusCode !== 200) {
            file.close();
            fs.unlinkSync(dest);
            return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close(resolve);
          });
        })
        .on("error", (err) => {
          file.close();
          try { fs.unlinkSync(dest); } catch {}
          reject(err);
        });
    }
    request(url);
  });
}

/**
 * Resolves the yt-dlp binary path for the current environment.
 * Priority:
 *  1. YT_DLP_PATH env var (user-configured)
 *  2. Windows local dev path C:\yt-dlp\yt-dlp.exe
 *  3. Bundled bin/yt-dlp (copied to /tmp for execute permissions)
 *  4. Download from GitHub to /tmp as last resort
 *  5. Fallback to system 'yt-dlp' in PATH
 */
export async function resolveYtDlpPath() {
  // 1. Explicit env override
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

  // Windows local dev
  if (process.platform === "win32") {
    return fs.existsSync("C:\\yt-dlp\\yt-dlp.exe")
      ? "C:\\yt-dlp\\yt-dlp.exe"
      : "yt-dlp";
  }

  // 3. Try bundled binary first (fast path - no network required)
  const bundledPath = path.join(process.cwd(), "bin", "yt-dlp");
  if (fs.existsSync(bundledPath)) {
    try {
      const bundledStats = fs.statSync(bundledPath);
      let needsCopy = true;
      if (fs.existsSync(TMP_PATH)) {
        const tmpStats = fs.statSync(TMP_PATH);
        if (tmpStats.size === bundledStats.size) needsCopy = false;
      }
      if (needsCopy) {
        fs.copyFileSync(bundledPath, TMP_PATH);
        fs.chmodSync(TMP_PATH, "755");
      }
      return TMP_PATH;
    } catch (err) {
      console.error("Failed to copy bundled yt-dlp:", err.message);
    }
  }

  // 4. Download from GitHub (fallback - works even without bundled binary)
  if (!fs.existsSync(TMP_PATH)) {
    console.log("yt-dlp not found locally, downloading from GitHub...");
    try {
      await downloadFile(GITHUB_URL, TMP_PATH);
      fs.chmodSync(TMP_PATH, "755");
      console.log("yt-dlp downloaded successfully to /tmp/yt-dlp");
    } catch (err) {
      console.error("Failed to download yt-dlp from GitHub:", err.message);
      return "yt-dlp"; // 5. Last resort: system PATH
    }
  } else {
    // Already cached in /tmp from previous invocation
    try { fs.chmodSync(TMP_PATH, "755"); } catch {}
  }

  return TMP_PATH;
}

/**
 * Resolves cookie arguments for yt-dlp.
 *
 * Priority:
 *  1. YT_DLP_COOKIES_FILE  – path to an existing cookies file on disk
 *  2. INSTAGRAM_COOKIES_CONTENT – raw Netscape cookies.txt content stored
 *     as a Vercel environment variable; written to /tmp/cookies.txt at runtime
 *  3. Windows fallback: --cookies-from-browser firefox (local dev only)
 *  4. [] – no cookies (anonymous; will fail on rate-limited platforms)
 *
 * Returns an array of yt-dlp argument strings to spread into ytDlpArgs.
 */
export function resolveCookieArgs() {
  // 1. Explicit file path override
  if (process.env.YT_DLP_COOKIES_FILE) {
    return ["--cookies", process.env.YT_DLP_COOKIES_FILE];
  }

  // 2. Raw cookies content stored as env var (best for Vercel)
  if (process.env.INSTAGRAM_COOKIES_CONTENT) {
    try {
      fs.writeFileSync(COOKIES_PATH, process.env.INSTAGRAM_COOKIES_CONTENT, "utf-8");
      console.log("Wrote cookies from env var to", COOKIES_PATH);
      return ["--cookies", COOKIES_PATH];
    } catch (err) {
      console.error("Failed to write cookies file:", err.message);
    }
  }

  // 3. Browser-based cookies (Windows local dev only)
  if (process.platform === "win32") {
    const browser = process.env.YT_DLP_COOKIES_BROWSER || "firefox";
    return ["--cookies-from-browser", browser];
  }

  // 4. No cookies – anonymous request
  return [];
}
