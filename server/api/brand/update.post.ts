import { z } from 'zod'
import type { Model } from 'mongoose'
import BrandModel from '../../../lib/database/models/Brand'
import loggedInUser from '../../utils/loggedInUser'

const Brand = BrandModel as Model<any>
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

const bodySchema = z.object({
  businessName: z.string().optional(),
  tagline: z.string().optional(),
  logoKey: z.string().optional(),
  headshotKey: z.string().optional(),
  colors: z.object({ bg: hex, fg: hex, accent: hex }).partial().optional(),
  fontPair: z.enum(['modern','editorial','classic','bold']).optional(),
  template: z.enum(['clean','banner','corner','frame','editorial']).optional(),
  textPosition: z.enum(['bottom','top','centre']).optional(),
  scrimStrength: z.number().min(0).max(100).optional(),
  ratio: z.enum(['portrait','square','story']).optional(),
  watermark: z.boolean().optional(),
  showAccentRule: z.boolean().optional(),
  // Single source of truth for the last slide. Previously split across
  // endCard and endSlide, only one of which the renderer read.
  endCard: z.object({
    layout: z.enum(['centred','stacked','split','minimal']),
    headline: z.string().max(60),
    subline: z.string().max(80),
    cta: z.string().max(42),
    background: z.enum(['brand','accent','ink']),
    usePhoto: z.boolean(),
    showLogo: z.boolean(),
    logoSize: z.enum(['small','medium','large']),
    showPhone: z.boolean(),
    showWebsite: z.boolean(),
    showHandle: z.boolean()
  }).partial().optional(),
  logoPosition: z.enum(['bottom-left','bottom-right','bottom-centre']).optional(),
  contact: z.object({
    phone: z.string(), website: z.string(), handle: z.string()
  }).partial().optional(),
  voice: z.any().optional()
})

/** POST /api/brand/update — hex validated here so bad values can't break canvas rendering. */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  await Brand.updateOne({ userId: user._id }, { $set: body }, { upsert: true })
  return { success: true }
})
