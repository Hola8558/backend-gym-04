import type { GetUploadSignedUrlParams } from '../types/get-upload-signed-url.params';
import type { UploadObjectParams } from '../types/upload-object.params';
import type { UploadObjectResult } from '../types/upload-object.result';

export interface ObjectStorageProvider {
  upload(params: UploadObjectParams): Promise<UploadObjectResult>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getUploadSignedUrl(params: GetUploadSignedUrlParams): Promise<string>;
}
