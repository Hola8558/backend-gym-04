import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ObjectStorageProvider } from './interfaces/object-storage-provider.interface';
import type { GetUploadSignedUrlParams } from './types/get-upload-signed-url.params';
import type { UploadObjectParams } from './types/upload-object.params';
import type { UploadObjectResult } from './types/upload-object.result';

const DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS = 3600;

/**
 * Isolated Cloudflare R2 adapter (S3-compatible).
 * Feature services depend only on ObjectStorageProvider.
 */
@Injectable()
export class R2ObjectStorageService implements ObjectStorageProvider {
  private readonly logger = new Logger(R2ObjectStorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.configService.getOrThrow<string>('R2_ENDPOINT'),
      // Path-style: https://{ACCOUNT}.r2.cloudflarestorage.com/{bucket}/{key}
      // Virtual-hosted (bucket as subdomain) is rejected by R2 edge with 403.
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
      // R2 does not support AWS SDK v3 default flexible checksums (CRC32).
      // Without this, presigned PUTs embed x-amz-checksum-* and browsers 403.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async upload(params: UploadObjectParams): Promise<UploadObjectResult> {
    const { key, body, contentType } = params;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    this.logger.debug(`Uploaded object key=${key}`);
    return { key };
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  async getUploadSignedUrl(
    params: GetUploadSignedUrlParams,
  ): Promise<string> {
    const { key, expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS } =
      params;

    // Loose signature: only `host` is signed. Do not put ContentType here —
    // browsers may strip it on PUT, which would 403 if it were in SignedHeaders.
    const putObjectParams = {
      Bucket: this.bucketName,
      Key: key,
    };

    const command = new PutObjectCommand(putObjectParams);

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    console.log('[R2ObjectStorage] PutObjectCommand params', putObjectParams);
    console.log('[R2ObjectStorage] generated presigned upload URL', uploadUrl);

    return uploadUrl;
  }
}
