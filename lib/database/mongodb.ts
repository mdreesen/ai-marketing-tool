import mongoose from 'mongoose'

/**
 * Serverless-safe connection. Carried over from GhostForm, where calling
 * mongoose.connect() per request re-resolved the Atlas SRV record on every
 * invocation until DNS refused it — surfacing as `getaddrinfo ENOTFOUND`.
 * Cache the PROMISE so concurrent cold-start requests share one connect.
 */
const globalCache = globalThis as unknown as {
  _mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}
const cached = globalCache._mongoose ?? { conn: null, promise: null }
globalCache._mongoose = cached

export const connectDB = async () => {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not set.')

  if (cached.conn && mongoose.connection.readyState === 1) return true

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Clear it so the NEXT request retries instead of awaiting a rejected promise.
    cached.promise = null
    console.error('[db] connection failed:', (err as Error)?.message)
    throw err
  }
  return true
}
