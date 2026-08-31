import mongoose, { Schema } from 'mongoose'

/**
 * Set once, applied to every slide. Separate from User because it's read on
 * every composition and will grow — multiple brands per account is an obvious
 * future ask, and that's painful to unpick from a User document later.
 */
const brandSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },

  businessName: { type: String, default: '' },
  tagline: { type: String, default: '' },

  // Object-storage keys, not URLs — the public base can change.
  logoKey: { type: String, default: '' },
  headshotKey: { type: String, default: '' },

  colors: {
    bg:     { type: String, default: '#0E0E11' },
    fg:     { type: String, default: '#F5F5F7' },
    accent: { type: String, default: '#6E56F8' }
  },
  // Typography — three genuinely different personalities rather than a font picker
  fontPair: {
    type: String,
    enum: ['modern','editorial','classic','bold'],
    default: 'modern'
  },

  // Slide look. Templates are the product: a business owner wants a good
  // default far more than infinite control.
  template: {
    type: String,
    enum: ['clean','banner','corner','frame','editorial'],
    default: 'clean'
  },

  // Where text sits on a photo slide
  textPosition: { type: String, enum: ['bottom','top','centre'], default: 'bottom' },

  // How dark the scrim behind text is, 0-100. Some photos need more.
  scrimStrength: { type: Number, default: 72, min: 0, max: 100 },

  // Output shape. 4:5 is the tallest the feed won't crop; 9:16 for stories.
  ratio: { type: String, enum: ['portrait','square','story'], default: 'portrait' },

  // Small business mark on every photo slide, so a screenshot still carries it
  watermark: { type: Boolean, default: true },

  // Accent rule above the headline
  showAccentRule: { type: Boolean, default: true },
  /**
   * THE END CARD — the last slide of every carousel.
   *
   * This used to be two settings groups (`endCard` and `endSlide`) with
   * overlapping fields. Only `endCard` was ever read by the renderer, so the
   * second group silently did nothing. They're merged here, keeping the richer
   * options from both.
   *
   * It's the only slide with a job beyond looking good: telling someone what to
   * do next. Everything before it belongs to the work.
   */
  endCard: {
    layout: {
      type: String,
      enum: ['centred', 'stacked', 'split', 'minimal'],
      default: 'centred'
    },

    // Defaults to the business name when blank — most people won't change it.
    headline: { type: String, default: '' },
    subline: { type: String, default: '' },

    // e.g. "Call for a free estimate" / "DM me to book a showing"
    cta: { type: String, default: '' },

    background: {
      type: String,
      enum: ['brand', 'accent', 'ink'],
      default: 'brand'
    },
    // Use the last photo as a darkened backdrop instead of a flat colour.
    usePhoto: { type: Boolean, default: false },

    showLogo: { type: Boolean, default: true },
    logoSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },

    // Granular, because plenty of people want the phone but not the handle.
    showPhone: { type: Boolean, default: true },
    showWebsite: { type: Boolean, default: true },
    showHandle: { type: Boolean, default: false }
  },
  logoPosition: { type: String, enum: ['bottom-left','bottom-right','bottom-centre'], default: 'bottom-left' },

  contact: {
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    handle: { type: String, default: '' }
  },

  // Same shape as GhostForm's voice profile — it's what stops captions
  // sounding like every other business's feed.
  voice: {
    tone: { type: String, default: 'warm' },
    about: { type: String, default: '' },
    focus: { type: String, default: '' },
    emoji: { type: String, default: 'some' },
    hashtags: { type: String, default: 'few' },
    avoid: { type: String, default: '' },
    samples: { type: String, default: '' }
  }
}, { timestamps: true })

export default mongoose.models.Brand || mongoose.model('Brand', brandSchema)
