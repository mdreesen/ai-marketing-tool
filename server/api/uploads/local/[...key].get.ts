import { readFile } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp'
}

/**
 * GET /api/uploads/local/<key>   — DEVELOPMENT ONLY
 * Serves what the PUT route above stored. Same-origin, so canvas export works
 * without a custom domain while developing.
 */
export default defineEventHandler(async (event) => {
  if (hasR2()) throw createError({ statusCode: 404, message: 'Not found.' })

  const key = (event.context.params?.key || '').split('/').filter(Boolean).join('/')
  const root = join(process.cwd(), '.data', 'uploads')
  const target = normalize(join(root, key))
  if (!target.startsWith(root)) throw createError({ statusCode: 400, message: 'Invalid key.' })

  try {
    const buf = await readFile(target)
    setHeader(event, 'Content-Type', MIME[extname(target).toLowerCase()] || 'application/octet-stream')
    setHeader(event, 'Cache-Control', 'public, max-age=3600')
    return buf
  } catch {
    throw createError({ statusCode: 404, message: 'Image not found.' })
  }
})
