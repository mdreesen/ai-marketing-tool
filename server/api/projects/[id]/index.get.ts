import type { Model } from 'mongoose'
import ProjectModel from '../../../../lib/database/models/Project'
import { readUrl } from '../../../utils/storage'
import loggedInUser from '../../../utils/loggedInUser'

const Project = ProjectModel as Model<any>

/**
 * GET /api/projects/:id
 * Also the polling endpoint while status is 'analysing'.
 * Resolves storage keys to URLs so the client can render immediately.
 */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const project = await Project.findOne({
    _id: event.context.params?.id,
    userId: user._id
  }).lean() as any

  if (!project) throw createError({ statusCode: 404, message: 'Project not found.' })

  project.assets = await Promise.all(
    (project.assets ?? []).map(async (a: any) => ({ ...a, url: await readUrl(a.key) }))
  )
  return project
})
