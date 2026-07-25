import path from "node:path";
import { spawnSync } from "node:child_process";
// import youtube downloader module
import { youtubeDl } from "youtube-dl-exec";
// import user module's 
import { safeFilename } from "../utils/safeFilename.js";
import { env } from "../config/env.js";

export type DownloadType = "audio" | "video";

export interface VideoInfo {
  title: string;
  channel: string;
  thumbnail: string;
}

type DownloadOptions = {
  noWarnings: boolean;
  cookies?: string;
  extractorArgs?: string;
  cookiesFromBrowser?: string;
};

function assertDownloadType(value: string): asserts value is DownloadType {
  if (value !== "audio" && value !== "video") {
    throw new Error("Invalid type. Use audio or video.");
  }
}

function assertFfmpegInstalled(): void {
  const result = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (result.error || result.status !== 0) {
    throw new Error(
      "ffmpeg is required to produce m4a/mp4 output. Install ffmpeg and try again.",
    );
  }
}

function getBaseOptions(): DownloadOptions {
  return {
    noWarnings: true,
    ...(env.ytdlpCookies ? { cookies: env.ytdlpCookies } : {}),
  };
}

function isBotCheckError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("Sign in to confirm you’re not a bot");
}

async function runYoutubeDlWithFallback(
  url: string,
  options: DownloadOptions & Record<string, unknown>,
): Promise<unknown> {
  try {
    return await youtubeDl(url, options);
  } catch (error) {
    if (!isBotCheckError(error)) throw error;

    const retryOptions: DownloadOptions & Record<string, unknown> = {
      ...options,
      extractorArgs: "youtube:player_client=android,web,ios",
      ...(env.ytdlpCookiesFromBrowser
        ? { cookiesFromBrowser: env.ytdlpCookiesFromBrowser }
        : {}),
    };

    return youtubeDl(url, retryOptions);
  }
}

// this function returns the metadata of the media
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  try {
    const info = (await runYoutubeDlWithFallback(url, {
      ...getBaseOptions(),
      dumpSingleJson: true,
    })) as Record<string, unknown>;

    return {
      title: String(info.title ?? "Untitled"),
      channel: String(info.uploader ?? "Unknown Channel"),
      thumbnail: String(info.thumbnail ?? ""),
    };
  } catch {
    const oembedUrl = new URL("https://www.youtube.com/oembed");
    oembedUrl.searchParams.set("url", url);
    oembedUrl.searchParams.set("format", "json");

    const response = await fetch(oembedUrl.toString());
    if (!response.ok) {
      throw new Error("Could not load video metadata");
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };

    return {
      title: data.title ?? "Untitled",
      channel: data.author_name ?? "Unknown Channel",
      thumbnail: data.thumbnail_url ?? "",
    };
  }
}

// this function downloads a media whether audio or video
export async function downloadMedia(
  url: string,
  type: string,
): Promise<{ filePath: string; fileName: string }> {
  assertDownloadType(type);
  assertFfmpegInstalled();

  const info = await getVideoInfo(url);
  const ext = type === "audio" ? "m4a" : "mp4";
  const fileName = `${safeFilename(info.title)}.${ext}`;
  const outputPath = path.join(process.cwd(), "downloads", fileName);

  if (type === "audio") {
    await runYoutubeDlWithFallback(url, {
      ...getBaseOptions(),
      format: "bestaudio[ext=m4a]/bestaudio",
      extractAudio: true,
      audioFormat: "m4a",
      output: outputPath,
    });
  } else {
    await runYoutubeDlWithFallback(url, {
      ...getBaseOptions(),
      format: "bestvideo[height<=720]+bestaudio/best[height<=720]",
      mergeOutputFormat: "mp4",
      remuxVideo: "mp4",
      output: outputPath,
    });
  }

  return { filePath: outputPath, fileName };
}
