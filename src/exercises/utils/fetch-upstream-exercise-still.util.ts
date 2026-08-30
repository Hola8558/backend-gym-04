import type { CatalogMediaProxyResult } from '../types/catalog-media-proxy-result.type';

/**
 * Fetches a remote exercise still with browser-like headers so CDNs that
 * check Referer/User-Agent do not reject the Nest server request.
 */
export async function fetchUpstreamExerciseStill(
  absoluteUrl: string,
): Promise<CatalogMediaProxyResult> {
  const origin = new URL(absoluteUrl).origin;
  const upstream = await fetch(absoluteUrl, {
    redirect: 'follow',
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: `${origin}/`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  });

  if (!upstream.ok) {
    throw new Error(`Upstream still HTTP ${upstream.status}`);
  }

  const contentType =
    upstream.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  const buffer = Buffer.from(await upstream.arrayBuffer());
  return { buffer, contentType };
}
