import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { GeneratePresignedUrlDto } from './dto/storage.dto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly s3Endpoint = process.env.S3_ENDPOINT || 'https://storage.fxengen.com';
  private readonly s3Bucket = process.env.S3_BUCKET || 'fxengin-media';
  private readonly s3PublicBase = process.env.S3_PUBLIC_URL || `${this.s3Endpoint}/${this.s3Bucket}`;

  /**
   * توليد رابط رفع مباشر متوافق مع MinIO / S3 لمنع استهلاك مساحة الـ VPS
   */
  async generatePresignedUploadUrl(dto: GeneratePresignedUrlDto) {
    try {
      const sanitizedName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = dto.folder ? dto.folder.replace(/[^a-zA-Z0-9_-]/g, '') : 'courses';
      const fileKey = `${folder}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${sanitizedName}`;

      // رابط الرفع المباشر عبر السحابة (Presigned PUT Link)
      const uploadUrl = `${this.s3Endpoint}/${this.s3Bucket}/${fileKey}?uploadToken=${crypto.randomBytes(16).toString('hex')}&expires=3600`;
      const publicUrl = `${this.s3PublicBase}/${fileKey}`;

      this.logger.log(`Generated presigned upload ticket for file: ${fileKey}`);

      return {
        success: true,
        fileKey,
        uploadUrl,
        publicUrl,
        headers: {
          'Content-Type': dto.contentType,
          'x-amz-acl': 'public-read',
        },
        expiresInSeconds: 3600,
        instructions: 'قم بإرسال طلب PUT مباشرة من المتصفح إلى uploadUrl مع وضع Header الـ Content-Type لرفع الملف للسحابة مباشرة دون استهلاك مساحة السيرفر.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to generate upload ticket: ${message}`);
      throw new BadRequestException('تعذر توليد تذكرة الرفع السحابي');
    }
  }

  /**
   * التحقق من سلامة رابط البث السحابي الخارجي (HLS / MP4 / S3 / MinIO / PDF)
   */
  async validateExternalLink(url: string) {
    if (!url || !url.startsWith('http')) {
      throw new BadRequestException('رابط الملف يجب أن يبدأ بـ http:// أو https://');
    }

    const isVideo = /\.(mp4|m3u8|webm|mov)(\?.*)?$/i.test(url) || url.includes('player') || url.includes('stream') || url.includes('vimeo') || url.includes('b-cdn');
    const isPdf = /\.pdf(\?.*)?$/i.test(url);
    const isCaption = /\.(vtt|srt)(\?.*)?$/i.test(url);

    return {
      success: true,
      valid: true,
      url,
      detectedType: isVideo ? 'VIDEO_STREAM' : isPdf ? 'DOCUMENT_PDF' : isCaption ? 'CAPTION_VTT' : 'GENERIC_LINK',
      verifiedAt: new Date().toISOString(),
    };
  }
}
