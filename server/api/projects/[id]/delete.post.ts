import type { Model } from 'mongoose'
import ProjectModel from '../../../../lib/database/models/Project'
import { deleteObject } from '../../../utils/storage'
import loggedInUser from '../../../utils/loggedInUser'

const Project = ProjectModel as Model<any>

/**
 * POST /api/projects/:id/delete
 *
 * Removes the project AND its stored photos. Deleting the record alone would
 * leave orphaned objects in the bucket that nobody can reach and everybody
 * keeps paying for — storage leaks are silent and permanent.
 *
 * Scoped to the owner: a user can only ever delete their own.
 */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const id = event.context.params?.id

  const project = await Project.findOne({ _id: id, userId: user._id }).lean() as any
  if (!project) throw createError({ statusCode: 404, message: 'Post not found.' })

  // Remove the objects first. If a delete fails we log and carry on — a
  // stranded file is bad, but blocking the user from removing their own post
  // because of a storage hiccup is worse.
  let orphaned = 0
  for (const asset of project.assets ?? []) {
    if (!asset?.key) continue
    try {
      await deleteObject(asset.key)
    } catch (err) {
      orphaned++
      console.error('[delete] could not remove object', asset.key, err)
    }
  }

  await Project.deleteOne({ _id: id, userId: user._id })

  if (orphaned) {
    console.warn(`[delete] project ${id} removed, but ${orphaned} file(s) remain in storage.`)
  }

  return { success: true }
})
