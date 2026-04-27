import type { Request, Response } from "express";
import { unlink } from "node:fs/promises";
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
    const message =
      error instanceof Error ? error.message : "Failed to fetch video info";
    res.status(500).json({ error: message });
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

    const { filePath, fileName } = await downloadMedia(url, type);

    res.download(filePath, fileName, async (downloadError) => {
      try {
        await unlink(filePath);
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
  const rawMessage =
    error instanceof Error ? error.message : "Failed to download media";
  const message = rawMessage.includes("Sign in to confirm you’re not a bot")
    ? "This video is protected by YouTube anti-bot checks. Configure YTDLP_COOKIES in .env or try another public video."
    : rawMessage;
  res.status(500).json({ error: message });
}
