import type { H3Event } from 'h3'
import type { Model } from 'mongoose'
import UserModelImport from '../../lib/database/models/User'
import { connectDB } from '../../lib/database/mongodb'

const User = UserModelImport as Model<any>

/**
 * Resolve the session user. Throws specific errors rather than returning
 * undefined — a silent undefined here caused a generic 500 in GhostForm when
 * it reached Mongoose as a missing required field.
 */
export default async function loggedInUser(event: H3Event) {
  const session = await getUserSession(event)
  const email = (session?.user as any)?.email
  if (!email) throw createError({ statusCode: 401, message: 'Session expired. Please sign in again.' })

  await connectDB()
  const user = await User.findOne({ email: String(email).toLowerCase() }).lean()
  if (!user) throw createError({ statusCode: 404, message: 'Account not found.' })

  return user as any
}
