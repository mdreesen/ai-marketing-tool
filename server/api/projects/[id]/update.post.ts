import { z } from 'zod'
import type { Model } from 'mongoose'
import ProjectModel from '../../../../lib/database/models/Project'
import loggedInUser from '../../../utils/loggedInUser'

const Project = ProjectModel as Model<any>

const bodySchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  reelFormat: z.string().optional(),
  status: z.enum(['draft','analysing','ready','exported','failed']).optional(),
  assets: z.array(z.any()).optional(),
  captions: z.array(z.any()).optional(),
  slideStyle: z.any().optional()
})

/** POST /api/projects/:id/update — user edits: reordering, text tweaks, chosen caption. */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const set: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) if (v !== undefined) set[k] = v
  if (set.status === 'exported') set.exportedAt = new Date()

  const res = await Project.updateOne(
    { _id: event.context.params?.id, userId: user._id },
    { $set: set }
  )
  if (res.matchedCount === 0) throw createError({ statusCode: 404, message: 'Project not found.' })

  return { success: true }
})
