import { z } from 'zod'
import type { Model } from 'mongoose'
import ProjectModel from '../../../../lib/database/models/Project'
import loggedInUser from '../../../utils/loggedInUser'

const Project = ProjectModel as Model<any>

const bodySchema = z.object({
  assets: z.array(z.object({
    key: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    bytes: z.number().optional()
  })).min(1)
})

/**
 * POST /api/projects/:id/attach
 * Records keys after the browser has uploaded straight to storage.
 */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const { assets } = await readValidatedBody(event, bodySchema.parse)

  const res = await Project.updateOne(
    { _id: event.context.params?.id, userId: user._id },
    { $push: { assets: { $each: assets.map((a, i) => ({ ...a, order: i, keep: true })) } } }
  )
  if (res.matchedCount === 0) throw createError({ statusCode: 404, message: 'Project not found.' })

  return { success: true }
})
