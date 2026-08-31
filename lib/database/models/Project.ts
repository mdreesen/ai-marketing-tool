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
