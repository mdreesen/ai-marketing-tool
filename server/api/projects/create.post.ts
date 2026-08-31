import { z } from 'zod'
import type { Model } from 'mongoose'
import ProjectModel from '../../../lib/database/models/Project'
import loggedInUser from '../../utils/loggedInUser'

const Project = ProjectModel as Model<any>

const bodySchema = z.object({
  title: z.string().optional(),
  postType: z.enum(['listing','just_sold','job_complete','event','general']).optional(),
  notes: z.string().optional()
})

/**
 * POST /api/projects/create
 * Created BEFORE upload — the id is needed to namespace the storage keys.
 */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)

  // "New post" is called with NO body — every field here is optional, and the
  // project is created empty so its id can namespace the uploads.
  //
  // readValidatedBody() hands `undefined` to the schema when the request has
  // no body, and z.object() rejects undefined outright. That threw a 400
  // before the handler ever ran. Read defensively and default to {}.
  const raw = await readBody(event).catch(() => ({}))
  const body = bodySchema.parse(raw ?? {})

  const project = await Project.create({
    userId: user._id,
    title: body.title || 'Untitled',
    postType: body.postType || 'general',
    notes: body.notes || '',
    industry: user.industry || 'other',
    status: 'draft'
  })

  return { _id: String(project._id) }
})
