import mongoose, { Schema } from 'mongoose'

const assetSchema = new Schema({
  key: { type: String, required: true },     // object-storage key
  width: Number,
  height: Number,
  bytes: Number,
  order: { type: Number, default: 0 },
  keep: { type: Boolean, default: true },
  dropReason: { type: String, default: '' }, // shown to the user, never hidden
  subject: { type: String, default: '' },
  quality: { type: String, enum: ['strong','usable','weak'], default: 'usable' },
  overlayLine: { type: String, default: '' }
}, { _id: false })

const projectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'Untitled' },

  status: {
    type: String,
    enum: ['draft','analysing','ready','exported','failed'],
    default: 'draft',
    index: true
  },
  failureReason: { type: String, default: '' },

  industry: { type: String, default: 'other' },
  postType: {
    type: String,
    enum: ['listing','just_sold','job_complete','event','general'],
    default: 'general'
  },
  // Optional context the owner types in — hugely improves output quality.
  notes: { type: String, default: '' },

  // Chosen reel format — shapes both the AI ordering and the video pacing.
  reelFormat: { type: String, default: '' },

  /**
   * Listing facts.
   *
   * Every source on realtor reels says the same thing: put the price, bed and
   * bath count, and the neighbourhood on screen. The app had nowhere to enter
   * them, so it could never produce the one thing agents actually post.
   *
   * All optional — a trades or church user simply won't fill them in.
   */
  listing: {
    price: { type: String, default: '' },       // string, not number: "$425,000" / "From $1.2M"
    beds: { type: String, default: '' },
    baths: { type: String, default: '' },
    sqft: { type: String, default: '' },
    neighborhood: { type: String, default: '' },
    address: { type: String, default: '' },
    /** Hold the price back to the final slide — the "guess the price" format. */
    revealPrice: { type: Boolean, default: false }
  },

  /** The opening line. Its own field because it does its own job. */
  hook: { type: String, default: '' },

  assets: [assetSchema],

  analysis: {
    theme: String,
    hookLine: String,
    closingLine: String,
    model: String,
    generatedAt: Date,
    voiceAt: Date
  },

  captions: [{
    text: String,
    hashtags: { type: String, default: '' },
    tone: { type: String, default: '' },
    chosen: { type: Boolean, default: false }
  }],

  slideStyle: {
    template: { type: String, default: 'clean' },
    bg: String, fg: String, accent: String
  },

  exportedAt: Date,
  postedAt: Date
}, { timestamps: true })

export default mongoose.models.Project || mongoose.model('Project', projectSchema)
