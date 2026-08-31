import type { Model } from 'mongoose'
import ProjectModel from '../../../../lib/database/models/Project'
import BrandModel from '../../../../lib/database/models/Brand'
import { analysePhotos } from '../../../utils/visionAnalysis'
import { draftCaptions } from '../../../utils/captionDraft'
import loggedInUser from '../../../utils/loggedInUser'
import { findFormat } from '../../../../shared/reelFormats'

const Project = ProjectModel as Model<any>
const Brand = BrandModel as Model<any>

/**
 * POST /api/projects/:id/analyse
 *
 * Sets status to 'analysing' and returns immediately; the client polls
 * GET /api/projects/:id. Analysis takes 5-20s — too long to block a request,
 * not long enough to justify a queue service in v1.
 *
 * The status is ALWAYS resolved (ready or failed), never left stuck on
 * 'analysing' — a spinner that never stops is worse than an error.
 */
export default defineEventHandler(async (event) => {
  const user = await loggedInUser(event)
  const id = event.context.params?.id

  const project = await Project.findOne({ _id: id, userId: user._id }).lean() as any
  if (!project) throw createError({ statusCode: 404, message: 'Project not found.' })
  if (!project.assets?.length) {
    throw createError({ statusCode: 400, message: 'Upload some photos first.' })
  }

  await Project.updateOne({ _id: id }, { $set: { status: 'analysing', failureReason: '' } })

  const run = async () => {
    try {
      const keys = project.assets.map((a: any) => a.key)
      // If a reel format was chosen, its directive shapes ordering and how much
      // overlay text belongs on the images — a quiet walkthrough and a numbered
      // tips list want opposite treatment.
      const fmt = project.reelFormat ? findFormat(project.reelFormat) : undefined

      const analysis = await analysePhotos(
        keys,
        project.postType || 'general',
        project.industry || 'other',
        project.notes || '',
        fmt?.aiDirective ?? '',
        fmt?.hookStyle ?? ''
      )

      // Merge verdicts back onto the stored assets by index.
      const assets = project.assets.map((a: any, i: number) => {
        const v = analysis.photos.find((p) => p.index === i)
        return v
          ? { ...a, keep: v.keep, dropReason: v.dropReason, order: v.order,
              subject: v.subject, quality: v.quality, overlayLine: v.overlayLine }
          : a
      })

      const brand = await Brand.findOne({ userId: user._id }).lean()
      const captions = await draftCaptions(
        analysis.theme,
        assets.filter((a: any) => a.keep).map((a: any) => a.subject),
        project.postType || 'general',
        brand || { businessName: user.businessName },
        project.notes || ''
      )

      await Project.updateOne({ _id: id }, {
        $set: {
          assets,
          analysis: {
            theme: analysis.theme,
            hookLine: analysis.hookLine,
            closingLine: analysis.closingLine,
            model: analysis.model,
            generatedAt: new Date(),
            // MUST live inside this object, not as a separate 'analysis.voiceAt'
            // key. Mongo rejects a $set that touches both a parent path and a
            // child of it — "would create a conflict at 'analysis'" — which threw,
            // hit the catch below, and surfaced as "We could not analyse those
            // photos" even though the analysis itself had succeeded.
            voiceAt: new Date()
          },
          captions,
          status: 'ready'
        }
      })
    } catch (err: any) {
      // Log everything — a generic message here hid a Mongo path conflict that
      // had nothing to do with the photos.
      console.error('[analyse] failed:', err?.message || err, err?.stack)

      // Give the user something they can act on where we can tell what broke.
      const msg = String(err?.message || '')
      let reason = 'Something went wrong on our end. Your photos are safe — please try again.'
      if (/conflict at/i.test(msg)) {
        reason = 'A problem saving the result. Please try again.'
      } else if (/429|rate/i.test(msg)) {
        reason = 'Too many requests right now. Wait a minute and try again.'
      } else if (/401|403|api key/i.test(msg)) {
        reason = 'Our AI service rejected the request. This is on us — please report it.'
      } else if (/timeout|ETIMEDOUT|abort/i.test(msg)) {
        reason = 'That took too long. Try again, or remove a few photos first.'
      } else if (/fetch|ENOTFOUND|network/i.test(msg)) {
        reason = 'We could not reach the photos. Check your storage settings.'
      }

      await Project.updateOne({ _id: id }, { $set: { status: 'failed', failureReason: reason } })
    }
  }

  // Fire and forget — the client polls for the result.
  event.waitUntil ? event.waitUntil(run()) : run()

  return { status: 'analysing' }
})
