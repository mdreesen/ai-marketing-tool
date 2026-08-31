import type { Model } from 'mongoose'
import ProjectModel from '../../../lib/database/models/Project'
import loggedInUser from '../../utils/loggedInUser'

const Project = ProjectModel as Model<any>

/** GET /api/projects — recent projects for the dashboard list. */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  return Project.find({ userId: user._id })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean()
})
