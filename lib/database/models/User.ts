import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema({
  businessName: { type: String, default: '' },
  industry: { type: String, enum: ['realtor', 'trades', 'church', 'other'], default: 'other' },
  onboarded: { type: Boolean, default: false },
  company: String,
  company_hashed: String,
  role: String,
  category: String,
  category_hashed: String,
  qr_code_slug: String,
  total_scans: { type: Number, default: 0 },
  leads_captured: { type: Number, default: 0 },
  name: String,
  email: { type: String, unique: true, required: true },
  email_hashed: String,
  phone: String,
  password: String,
  region: String,
  country: String,
  reset_password_token: String,
  privacy_policy: Boolean,
  paid: { type: Boolean, default: false },
  paid_tier: String,
  // Which plan they subscribed to ('shadow' | 'phantom'), set by the Stripe webhook.
  plan: { type: String, default: null },
  // Stripe subscription lifecycle - required so we can cancel on account deletion.
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  subscriptionStatus: {
    type: String,
    // mirrors Stripe subscription statuses; 'none' = never subscribed
    enum: ['none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'],
    default: 'none'
  },
  calendar_link: String,
  // IANA timezone (e.g. 'America/Denver'). Used so scheduled sends fire
  // at the realtor's local morning, not the server's UTC hour.
  // Falls back to 'America/Denver' when unset.
  timezone: { type: String, default: 'America/Denver' },
  // How many days of silence before a lead is considered "cold" and
  // resurfaced in the daily briefing. Per-realtor tunable.
  cold_lead_after_days: { type: Number, default: 14 },
  // Whether the realtor has finished (or skipped) the guided tour.
  tour_completed: { type: Boolean, default: false },

  // ============================================================
  // Branding — used by outgoing emails AND the social card
  // generator. These belong to the REALTOR: a lead should never
  // see software branding they don't recognise.
  // ============================================================
  headshot_url: { type: String, default: '' },
  brand_color: { type: String, default: '#B5563A' },
  title_line: { type: String, default: '' },
  website: { type: String, default: '' },

  // Saved social-card look, so every card an agent makes matches the last one.
  // Consistency across a feed is the actual point of these graphics.
  cardStyle: {
    theme: { type: String, default: 'light' },      // light | dark | accent | custom
    bg: { type: String, default: '#F7F4EF' },
    fg: { type: String, default: '#1F1B16' },
    accent: { type: String, default: '#B5563A' },
    showAvatar: { type: Boolean, default: true },
    showBar: { type: Boolean, default: true },
    ratio: { type: String, default: 'square' }      // square | story | landscape
  },

  // ============================================================
  // Social voice profile — captured once, then used to make every
  // generated post sound like this specific realtor rather than
  // generic real-estate filler. Without it, AI posts all read the
  // same and agents stop using the feature.
  // ============================================================
  voice: {
    // How they talk: 'warm' | 'straight' | 'playful' | 'polished'
    tone: { type: String, default: 'warm' },
    // Free text: "former teacher, two kids, obsessed with trail running"
    about: { type: String, default: '' },
    // What they want to be known for locally
    focus: { type: String, default: '' },
    // 'none' | 'some' | 'lots'
    emoji: { type: String, default: 'some' },
    // 'none' | 'few' | 'many'
    hashtags: { type: String, default: 'few' },
    // Words/phrases they actually use, and ones to avoid
    phrases: { type: String, default: '' },
    avoid: { type: String, default: '' },
    // Pasted samples of their real posts — by far the strongest signal
    samples: { type: String, default: '' }
  }
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', userSchema)
