import type { Request, Response } from "express";
import { NodeYtApiError } from "nodeytapi";
import { downloadMedia, getVideoInfo } from "../services/youtubeService.js";

export async function infoController(req: Request, res: Response): Promise<void> {
  try {
    const { url } = req.body as { url?: string };
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }

    const info = await getVideoInfo(url);
    res.json(info);
  } catch (error) {
    console.error("info error:", error);
    const { status, message } = toErrorResponse(error, "Failed to fetch video info");
    res.status(status).json({ error: message });
  }
}

export async function downloadController(req: Request, res: Response): Promise<void> {
  try {
    const { url, type } = req.body as { url?: string; type?: string };
    await sendDownload(url, type, res);
  } catch (error) {
    handleDownloadError(error, res);
  }
}

export async function downloadByQueryController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const url =
      typeof req.query.url === "string" ? req.query.url : undefined;
    const type =
      typeof req.query.type === "string" ? req.query.type : undefined;
    await sendDownload(url, type, res);
  } catch (error) {
    handleDownloadError(error, res);
  }
}

async function sendDownload(
  url: string | undefined,
  type: string | undefined,
  res: Response,
): Promise<void> {
  if (!url || !type) {
    res.status(400).json({ error: "url and type are required" });
    return;
  }

  const { filePath, fileName, cleanup } = await downloadMedia(url, type);

  res.download(filePath, fileName, async (downloadError) => {
    try {
      await cleanup();
    } catch (cleanupError) {
      console.warn("cleanup warning:", cleanupError);
    }

    if (downloadError && !res.headersSent) {
      res.status(500).json({ error: "Failed while sending downloaded file" });
    }
  });
}

function handleDownloadError(error: unknown, res: Response): void {
  console.error("download error:", error);
  const { status, message } = toErrorResponse(error, "Failed to download media");
  res.status(status).json({ error: message });
}

function toErrorResponse(
  error: unknown,
  fallbackMessage: string,
): { status: number; message: string } {
  if (error instanceof NodeYtApiError) {
    return {
      status: statusForCode(error.code),
      message: messageForCode(error.code, error.message),
    };
  }

  return {
    status: 500,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
}

function statusForCode(code: string): number {
  switch (code) {
    case "INVALID_URL":
    case "VIDEO_UNAVAILABLE":
      return 400;
    default:
      return 500;
  }
}

function messageForCode(code: string, fallback: string): string {
  switch (code) {
    case "INVALID_URL":
      return "That doesn't look like a valid YouTube URL.";
    case "VIDEO_UNAVAILABLE":
      return "This video is unavailable, private, or region-locked.";
    case "STREAM_NOT_FOUND":
      return "No downloadable stream could be found for this video, even after trying other qualities.";
    case "DOWNLOAD_FAILED":
      return "The download failed partway through. Please try again.";
    case "PYTHON_NOT_FOUND":
      return "Server misconfiguration: Python 3 runtime was not found.";
    case "PROCESS_ERROR":
      return "An internal error occurred while processing this video.";
    case "PARSE_ERROR":
      return "Could not read the response from the video source.";
    default:
      return fallback;
  }
}
