import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

// Simple sharp import — optional, skip thumbnail if not available
let sharp:
  | ((input: Buffer) => { resize: (w: number) => { toBuffer: () => Promise<Buffer> } })
  | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp');
} catch {
  sharp = undefined;
}

const UPLOADS_BASE = join(process.cwd(), 'uploads', 'codex');
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const THUMB_WIDTH = 300;

export interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string | null;
  sizeBytes: number;
  mimeType: string;
}

@Injectable()
export class CodexStorageService {
  async uploadScreenshot(
    screenId: string,
    buffer: Buffer,
    mimeType: string,
    _originalName: string,
  ): Promise<UploadResult> {
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Allowed: PNG, JPEG, WebP`,
      );
    }
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException(
        `File too large: ${Math.round(buffer.length / 1024)}KB. Max: 10MB`,
      );
    }

    const dir = join(UPLOADS_BASE, screenId);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const ext =
      mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const filename = `original.${ext}`;
    const filepath = join(dir, filename);
    await writeFile(filepath, buffer);

    const originalUrl = `/uploads/codex/${screenId}/${filename}`;

    // Generate thumbnail if sharp is available
    let thumbnailUrl: string | null = null;
    if (sharp) {
      try {
        const thumbBuffer = await sharp(buffer).resize(THUMB_WIDTH).toBuffer();
        const thumbPath = join(dir, `thumb.${ext}`);
        await writeFile(thumbPath, thumbBuffer);
        thumbnailUrl = `/uploads/codex/${screenId}/thumb.${ext}`;
      } catch {
        // Thumbnail generation failed silently — original still available
      }
    }

    return {
      originalUrl,
      thumbnailUrl,
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  async deleteScreenFiles(screenId: string): Promise<void> {
    const dir = join(UPLOADS_BASE, screenId);
    if (!existsSync(dir)) return;
    const { rm } = await import('fs/promises');
    await rm(dir, { recursive: true, force: true });
  }

  getUploadsBasePath(): string {
    return UPLOADS_BASE;
  }
}
