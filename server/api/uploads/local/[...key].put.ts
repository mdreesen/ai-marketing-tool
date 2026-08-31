import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname, normalize } from 'node:path'

/**
 * PUT /api/uploads/local/<key>   — DEVELOPMENT ONLY
 *
 * Stands in for a presigned R2 upload when R2 isn't configured, so the whole
 * flow can be exercised with no external service. Files land in .data/uploads.
 *
 * Not for production: it writes to the local filesystem, which on a serverless
 * host is ephemeral and per-instance. The guard below refuses to run when R2
 * IS configured, so this can't silently shadow real storage.
 */
export default defineEventHandler(async (event) => {
  if (hasR2()) {
    throw createError({ statusCode: 404, message: 'Not found.' })
  }

  const parts = (event.context.params?.key || '').split('/').filter(Boolean)
  const key = parts.join('/')

  // Path traversal guard — a key like ../../etc/passwd must not escape .data.
  const root = join(process.cwd(), '.data', 'uploads')
  const target = normalize(join(root, key))
  if (!target.startsWith(root)) {
    throw createError({ statusCode: 400, message: 'Invalid key.' })
  }

  const body = await readRawBody(event, false)
  if (!body) throw createError({ statusCode: 400, message: 'Empty upload.' })

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, body as Buffer)

  return { success: true }
})
