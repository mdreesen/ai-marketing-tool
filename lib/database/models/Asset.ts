import mongoose, { Schema } from 'mongoose'

/**
 * User-uploaded images (currently just headshots).
 *
 * Stored in their own collection rather than on the User document so a fetch of
 * the user record doesn't drag ~100KB of base64 along with it on every request.
 *
 * Why base64 in Mongo rather than S3/Cloudinary/Vercel Blob: no external service
 * is configured, and a headshot compressed client-side to a 512px square is
 * ~50-90KB — comfortably inside Mongo's 16MB document limit. Serving it from our
 * OWN origin also means the social-card canvas isn't tainted, which is what
 * breaks PNG export when a cross-origin URL is used.
 *
 * If image volume ever grows beyond headshots, this is the seam to swap for
 * object storage — the API shape stays the same.
 */
const assetSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  kind: {
    type: String,
    enum: ['headshot', 'logo'],
    default: 'headshot',
    index: true
  },
  mime: { type: String, default: 'image/jpeg' },
  /** Raw base64 (no data: prefix) */
  data: { type: String, required: true },
  bytes: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 }
}, { timestamps: true })

// One asset of each kind per user — uploading again replaces it.
assetSchema.index({ userId: 1, kind: 1 }, { unique: true })

export default mongoose.models.Asset || mongoose.model('Asset', assetSchema)
