import fs from "fs";
import path from "path";
import { Context } from "telegraf";
import { logError } from "./logError";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads", "audio");

// Ensure downloads directory exists
function ensureDownloadsDir() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Downloads an audio file from Telegram and saves it locally
 * @param ctx - Telegraf context
 * @param fileId - Telegram file ID
 * @param messageId - Message ID for filename generation
 * @param fileName - Optional original file name
 * @param mimeType - Optional MIME type
 * @returns Download result with file path or error
 */
export async function downloadAudioFile(
  ctx: Context,
  fileId: string,
  messageId: number,
  fileName?: string,
  mimeType?: string,
): Promise<DownloadResult> {
  try {
    ensureDownloadsDir();

    let fileExtension = "mp3";

    // Try to get file info, but handle case when file is too big
    try {
      const file = await ctx.telegram.getFile(fileId);
      if (file?.file_path) {
        fileExtension = file.file_path.split(".").pop()?.toLowerCase() || "mp3";
      }
    } catch (error: any) {
      // If file is too big, getFile() will fail, but we can still try to download
      // using getFileLink() and determine extension from fileName or mimeType
      if (error?.response?.error_code === 400 && error?.response?.description?.includes("too big")) {
        // File is too big for getFile(), but we can still download it
        // Determine extension from fileName or mimeType
        if (fileName) {
          const extMatch = fileName.match(/\.([^.]+)$/i);
          if (extMatch) {
            fileExtension = extMatch[1].toLowerCase();
          }
        } else if (mimeType) {
          // Map common audio mime types to extensions
          const mimeToExt: Record<string, string> = {
            "audio/mpeg": "mp3",
            "audio/mp3": "mp3",
            "audio/wav": "wav",
            "audio/wave": "wav",
            "audio/x-wav": "wav",
            "audio/ogg": "ogg",
            "audio/opus": "opus",
            "audio/mp4": "m4a",
            "audio/x-m4a": "m4a",
            "audio/flac": "flac",
            "audio/aac": "aac",
            "audio/x-ms-wma": "wma",
          };
          fileExtension = mimeToExt[mimeType] || "mp3";
        }
      } else {
        // Some other error occurred
        throw error;
      }
    }

    // Generate unique filename: messageId_timestamp.extension
    const timestamp = Date.now();
    const filename = `${messageId}_${timestamp}.${fileExtension}`;
    const filePath = path.join(DOWNLOADS_DIR, filename);

    // Download file - Telegram Bot API has a 20MB limit for file downloads
    let fileData: Uint8Array;
    try {
      // Try getFileLink first (works for files < 20MB)
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.toString());

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to download file: ${response.statusText}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      fileData = new Uint8Array(arrayBuffer);
    } catch (error: any) {
      // If getFileLink fails because file is too big
      if (
        error?.response?.error_code === 400 &&
        error?.response?.description?.includes("too big")
      ) {
        // FIXME: Telegram Bot API has a 20MB limit for file downloads
        // Files larger than 20MB cannot be downloaded through Bot API
        // This is a Telegram limitation, not a code issue
        return {
          success: false,
          error: "Файл слишком большой (больше 20MB). Telegram Bot API не поддерживает загрузку файлов больше 20MB.",
        };
      } else {
        // Some other error occurred
        throw error;
      }
    }

    // Save file to disk
    fs.writeFileSync(filePath, fileData);

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    logError(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
