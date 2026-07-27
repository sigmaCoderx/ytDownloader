import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { YouTube, NodeYtApiError } from "nodeytapi";
import type { DownloadResult, StreamInfo } from "nodeytapi";

export type DownloadType = "audio" | "video";

export interface VideoInfo {
  title: string;
  channel: string;
  thumbnail: string;
}

export interface DownloadedMedia {
  filePath: string;
  fileName: string;
  /** Removes the per-request temp folder this file lived in. */
  cleanup: () => Promise<void>;
}

function assertDownloadType(value: string): asserts value is DownloadType {
  if (value !== "audio" && value !== "video") {
    throw new Error("Invalid type. Use audio or video.");
  }
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const yt = new YouTube(url);
  const info = await yt.getInfo();

  return {
    title: info.title || "Untitled",
    channel: info.author || "Unknown Channel",
    thumbnail: info.thumbnail || "",
  };
}

/** Parses "128kbps" -> 128 so streams can be sorted by quality. */
function parseAbr(abr: string | null): number {
  if (!abr) return 0;
  const match = abr.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

/**
 * downloadAudio() grabs the single best-quality audio stream, but that
 * exact stream can occasionally be gone/throttled by the time we fetch it
 * (expired signature, region hiccup, etc). If it fails, fall back through
 * the remaining audio streams, best quality first, until one succeeds.
 */
async function downloadAudioWithFallback(
  yt: YouTube,
  outputDir: string,
): Promise<DownloadResult> {
  try {
    return await yt.downloadAudio(outputDir);
  } catch (firstError) {
    if (!(firstError instanceof NodeYtApiError)) throw firstError;

    const streams: StreamInfo[] = await yt.getStreams();
    const audioStreams = streams
      .filter((stream) => stream.type === "audio")
      .sort((a, b) => parseAbr(b.abr) - parseAbr(a.abr));

    if (audioStreams.length === 0) {
      throw firstError;
    }

    let lastError: unknown = firstError;
    for (const stream of audioStreams) {
      try {
        return await yt.download({ itag: stream.itag, outputDir });
      } catch (error) {
        lastError = error;
        // try the next best available quality
      }
    }

    throw lastError;
  }
}

export async function downloadMedia(
  url: string,
  type: string,
): Promise<DownloadedMedia> {
  assertDownloadType(type);

  // Each request gets its own folder so concurrent downloads never collide
  // and cleanup is a single recursive rm, whatever the file is named.
  const requestId = randomUUID();
  const outputDir = path.join(process.cwd(), "downloads", requestId);
  await mkdir(outputDir, { recursive: true });

  const cleanup = () => rm(outputDir, { recursive: true, force: true });

  try {
    const yt = new YouTube(url);

    const result =
      type === "audio"
        ? await downloadAudioWithFallback(yt, outputDir)
        : await yt.downloadVideo(outputDir);

    if (!result.success) {
      throw new Error("Download did not complete successfully.");
    }

    return {
      filePath: result.path,
      fileName: path.basename(result.path),
      cleanup,
    };
  } catch (error) {
    // Nothing (or a partial file) was produced - clear the folder now
    // instead of leaving it around, then re-throw for the controller.
    await cleanup().catch(() => undefined);
    throw error;
  }
}
