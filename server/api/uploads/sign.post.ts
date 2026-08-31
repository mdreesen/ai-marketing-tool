import { z } from 'zod'
import { assertUploadable, buildKey, presignUpload } from '../../utils/storage'
import loggedInUser from '../../utils/loggedInUser'

const bodySchema = z.object({
  // Brand assets (logo, headshot) have no project — they belong to the user.
  projectId: z.string().optional(),
  scope: z.enum(['project', 'brand']).optional(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  bytes: z.number().int().positive()
})

/**
 * POST /api/uploads/sign
 * Returns a short-lived URL the browser PUTs the image to directly.
 * The file never passes through this server — see server/utils/storage.ts.
 */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const { projectId, scope, filename, contentType, bytes } = await readValidatedBody(event, bodySchema.parse)

  assertUploadable(contentType, bytes)

  // Brand assets live under a stable per-user path rather than a project one,
  // so they survive projects being deleted.
  const key = (scope === 'brand' || !projectId)
    ? buildKey(String(user._id), 'brand', filename)
    : buildKey(String(user._id), projectId, filename)
  const uploadUrl = await presignUpload(key, contentType)

  return { uploadUrl, key }
})
