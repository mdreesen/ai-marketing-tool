import type { Model } from 'mongoose'
import BrandModel from '../../../lib/database/models/Brand'
import { readUrl } from '../../utils/storage'
import loggedInUser from '../../utils/loggedInUser'

const Brand = BrandModel as Model<any>

/** GET /api/brand — auto-creates on first read so the UI never 404s. */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)

  let brand = await Brand.findOne({ userId: user._id }).lean() as any
  if (!brand) {
    brand = (await Brand.create({
      userId: user._id,
      businessName: user.businessName || ''
    })).toObject()
  }

  if (brand.logoKey) brand.logoUrl = await readUrl(brand.logoKey)
  if (brand.headshotKey) brand.headshotUrl = await readUrl(brand.headshotKey)
  return brand
})
