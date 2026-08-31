import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * ============================================================================
 * OBJECT STORAGE (Cloudflare R2 — S3-compatible)
 * ============================================================================
 * Images never pass through the Nuxt server. The client asks for a presigned
 * URL and PUTs the file straight to the bucket.
 *
 * Why: a 10-photo carousel is ~30MB raw. Routing that through a serverless
 * function burns execution time, risks the request body limit, and buys
 * nothing — the function has no reason to see the bytes.
 *
 * R2 over S3 because egress is free. In this product the dominant traffic is
 * previews reloading during editing and users re-downloading their carousels,
 * which on S3 is the line item that grows quietly.
 * ============================================================================
 */

let client: S3Client | null = null

/**
 * Is R2 actually configured?
 *
 * When it isn't, we fall back to a LOCAL DISK driver rather than failing. That
 * means the whole upload → analyse → compose flow can be run and tested with
 * no external service at all — you only need Cloudflare when you deploy.
 */
export function hasR2(): boolean {
  const r2 = useRuntimeConfig().r2 as any
  return Boolean(r2?.accountId && r2?.accessKeyId && r2?.secretAccessKey && r2?.bucket)
}

function s3(): S3Client {
  if (client) return client
  const cfg = useRuntimeConfig()
  const { accountId, accessKeyId, secretAccessKey } = cfg.r2 as any

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw createError({
      statusCode: 500,
      message: 'Object storage is not configured. Set R2_* in .env, or leave them unset to use local storage in development.'
    })
  }

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  })
  return client
}

function bucket(): string {
  const b = (useRuntimeConfig().r2 as any)?.bucket
  if (!b) throw createError({ statusCode: 500, message: 'R2_BUCKET is not set.' })
  return b
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Server-side guard. The client compresses first, so this is a backstop. */
const MAX_BYTES = 8 * 1024 * 1024

export function assertUploadable(contentType: string, bytes: number) {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw createError({ statusCode: 400, message: 'Only JPEG, PNG or WebP images.' })
  }
  if (bytes > MAX_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'That image is too large even after compression. Try a smaller one.'
    })
  }
}

/** Namespaced by user so a leaked key can't enumerate someone else's uploads. */
export function buildKey(userId: string, projectId: string, filename: string): string {
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const rand = Math.random().toString(36).slice(2, 10)
  return `u/${userId}/p/${projectId}/${Date.now()}-${rand}.${ext}`
}

/** Short-lived PUT URL — long enough for a slow upload, short enough to matter. */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  // Local driver: the "presigned URL" is just our own PUT route. The client
  // code is identical either way — it PUTs the blob to whatever URL it gets.
  if (!hasR2()) return `/api/uploads/local/${key}`

  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn: 600 }
  )
}

/**
 * Read URL. Prefer a public custom domain: canvas composition needs images to
 * be SAME-ORIGIN or toDataURL() throws on a tainted canvas — the exact bug hit
 * in GhostForm's card generator when a headshot came from another host.
 */
export async function readUrl(key: string): Promise<string> {
  // Local driver — and conveniently same-origin, so canvas export works
  // without any custom-domain setup while you're developing.
  if (!hasR2()) return `/api/uploads/local/${key}`

  const base = useRuntimeConfig().public.assetBase
  if (base) return `${String(base).replace(/\/$/, '')}/${key}`

  // Fallback for local dev without a custom domain.
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 3600 })
}

export async function deleteObject(key: string): Promise<void> {
  if (!hasR2()) {
    const { unlink } = await import('node:fs/promises')
    const { join } = await import('node:path')
    await unlink(join(process.cwd(), '.data', 'uploads', key)).catch(() => {})
    return
  }
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

/** Fetch bytes for vision analysis. */
export async function fetchAsBase64(key: string): Promise<{ data: string; mime: string } | null> {
  try {
    const url = await readUrl(key)
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return { data: buf.toString('base64'), mime: res.headers.get('content-type') || 'image/jpeg' }
  } catch (err) {
    console.error('[storage] fetch failed for', key, err)
    return null
  }
}
