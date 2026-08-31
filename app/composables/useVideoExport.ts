/**
 * ============================================================================
 * VIDEO EXPORT — H.264 MP4, encoded in the browser
 * ============================================================================
 * Uses WebCodecs (VideoEncoder) plus an MP4 muxer. This matters:
 *
 *   - Real MP4/H.264. MediaRecorder gives WebM, which Instagram and TikTok
 *     will not accept — the most common way a browser "video export" turns
 *     out useless.
 *   - Hardware accelerated, so a 12-slide reel encodes in seconds rather than
 *     the minute-plus ffmpeg.wasm takes, without a 25MB wasm download.
 *   - $0 per video. Same economics as the carousels; no render service.
 *
 * WHAT MAKES IT LOOK LIKE VIDEO RATHER THAN A SLIDESHOW
 *   1. Ken Burns — a slow, continuous push or pan on every still. This is the
 *      single biggest difference. A static image held for three seconds reads
 *      as a slideshow; the same image drifting reads as film.
 *   2. Crossfades between slides instead of hard cuts.
 *   3. Text that arrives slightly after the image settles, not with it.
 *
 * NO AUDIO, deliberately. Licensed music is a real cost and platforms mute
 * unlicensed tracks. Users add sound in Instagram or TikTok directly — and
 * platform-native audio gets algorithmic preference, so this is genuinely the
 * better outcome, not a shortcut.
 * ============================================================================
 */

import { drawEndCard } from '~/utils/drawEndCard'
import { applyGrade, applyVignette, applyLetterbox } from '~/utils/imageQuality'

export interface VideoSlide {
  photoUrl: string
  overlayLine?: string
  isBrandSlide?: boolean
}

export interface VideoOptions {
  /**
   * Cinematic treatment. Slower motion, 2.39:1 letterbox, a restrained grade
   * and a vignette. Also raises the bitrate — subtle grading is exactly where
   * compression banding becomes visible.
   */
  cinematic?: boolean
  width?: number
  height?: number
  fps?: number
  /** Seconds each slide is on screen, including its share of the crossfade. */
  secondsPerSlide?: number
  crossfade?: number
  /** 'reel' 1080x1920 · 'square' 1080x1080 · 'feed' 1080x1350 */
  format?: 'reel' | 'square' | 'feed'
}

const FORMATS = {
  reel:   { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  feed:   { width: 1080, height: 1350 }
}

/**
 * Presets, because "seconds per slide" is not a decision a roofer should have
 * to make. Each one is chosen against a real platform limit:
 *
 *   Instagram Story  15s per card  ← the binding constraint
 *   Instagram Reels  90s
 *   YouTube Shorts   60s
 *   TikTok           10 minutes
 *
 * 'story' shortens the hold automatically so a 10-slide set still fits in 15s
 * rather than being silently truncated on upload.
 */
export const PACE_PRESETS = {
  snappy:  { secondsPerSlide: 1.4, crossfade: 0.25, label: 'Snappy',  hint: 'Fast cuts — best for Stories' },
  natural: { secondsPerSlide: 2.4, crossfade: 0.4,  label: 'Natural', hint: 'Reads comfortably' },
  relaxed: { secondsPerSlide: 3.4, crossfade: 0.6,  label: 'Relaxed', hint: 'Time to take each shot in' }
}

/** Longest a video can run on each platform, in seconds. */
export const PLATFORM_LIMITS: Record<string, number> = {
  reel: 90, square: 600, feed: 600, story: 15
}

/** Predict the length before rendering, so we can warn instead of surprising. */
export function estimateDuration(slideCount: number, secondsPerSlide: number): number {
  return +(slideCount * secondsPerSlide).toFixed(1)
}

/** Rough MB at the configured bitrate — 37MB is a slow upload on mobile data. */
export function estimateSizeMb(seconds: number, bitrateMbps = 10): number {
  return +(seconds * bitrateMbps / 8).toFixed(1)
}

export interface VideoSupport {
  supported: boolean
  reason: string
}

/**
 * Can this browser encode H.264? Checked before we offer the button — an
 * export that fails after 30 seconds of work is worse than one never offered.
 */
export async function checkVideoSupport(): Promise<VideoSupport> {
  if (typeof window === 'undefined') return { supported: false, reason: '' }

  if (!('VideoEncoder' in window)) {
    return {
      supported: false,
      reason: 'This browser can\'t make videos yet. Chrome, Edge or Safari 16.4+ will work.'
    }
  }

  try {
    // avc1.42002A = H.264 Baseline, Level 4.2 — widely playable, and what the
    // social platforms expect.
    const cfg = {
      codec: 'avc1.42002A',
      width: 1080,
      height: 1920,
      bitrate: 10_000_000,
      framerate: 30
    }
    const { supported } = await (window as any).VideoEncoder.isConfigSupported(cfg)
    return supported
      ? { supported: true, reason: '' }
      : { supported: false, reason: 'This browser can\'t encode MP4 video. Try Chrome or Edge.' }
  } catch {
    return { supported: false, reason: 'Video export isn\'t available in this browser.' }
  }
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Ease in/out — linear motion is what makes cheap slideshows look cheap. */
const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

/**
 * Ken Burns move for slide n. Alternating direction stops a long carousel
 * feeling mechanical — every shot drifting the same way is its own tell.
 */
/**
 * Luxury motion: half the travel, always slow, never a pan reversal mid-set.
 * Big obvious zooms are the clearest tell of an automated slideshow.
 */
function cinematicMotionFor(i: number) {
  const moves = [
    { fromScale: 1.00, toScale: 1.045, fromX: 0.5,  toX: 0.5,  fromY: 0.52, toY: 0.48 },
    { fromScale: 1.045, toScale: 1.00, fromX: 0.5,  toX: 0.5,  fromY: 0.48, toY: 0.52 },
    { fromScale: 1.03, toScale: 1.03, fromX: 0.45, toX: 0.55, fromY: 0.5,  toY: 0.5  },
    { fromScale: 1.03, toScale: 1.06, fromX: 0.5,  toX: 0.5,  fromY: 0.5,  toY: 0.5  }
  ]
  return moves[i % moves.length]!
}

function motionFor(i: number) {
  const moves = [
    { fromScale: 1.00, toScale: 1.10, fromX: 0.5,  toX: 0.5,  fromY: 0.5,  toY: 0.5  }, // push in
    { fromScale: 1.10, toScale: 1.00, fromX: 0.5,  toX: 0.5,  fromY: 0.5,  toY: 0.5  }, // pull out
    { fromScale: 1.08, toScale: 1.08, fromX: 0.38, toX: 0.62, fromY: 0.5,  toY: 0.5  }, // pan right
    { fromScale: 1.08, toScale: 1.08, fromX: 0.62, toX: 0.38, fromY: 0.5,  toY: 0.5  }, // pan left
    { fromScale: 1.02, toScale: 1.12, fromX: 0.5,  toX: 0.5,  fromY: 0.62, toY: 0.42 }  // push up
  ]
  return moves[i % moves.length]!
}

export function useVideoExport() {
  const rendering = ref(false)
  const progress = ref(0)
  const stage = ref('')

  /**
   * Draw one frame. Kept separate from encoding so the same code can drive a
   * live preview later without duplicating the motion maths.
   */
  function drawFrame(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    W: number, H: number,
    t: number,            // 0-1 through this slide
    slideIndex: number,
    brand: any,
    overlayLine: string,
    isBrandSlide: boolean,
    alpha: number,
    brandLogo: HTMLImageElement | null = null,
    lastPhoto: HTMLImageElement | null = null,
    cinematic = false
  ) {
    const col = {
      bg: /^#[0-9A-Fa-f]{6}$/.test(brand?.colors?.bg) ? brand.colors.bg : '#0B0B0F',
      fg: /^#[0-9A-Fa-f]{6}$/.test(brand?.colors?.fg) ? brand.colors.fg : '#F4F4F6',
      accent: /^#[0-9A-Fa-f]{6}$/.test(brand?.colors?.accent) ? brand.colors.accent : '#2DD4DC'
    }
    const k = W / 1080
    const PAD = Math.round(80 * k)

    ctx.save()
    ctx.globalAlpha = alpha

    if (isBrandSlide || !img) {
      if (isBrandSlide) {
        // The SAME renderer the carousel uses. Previously this was a stripped
        // copy that only drew the headline and CTA, so a configured brand
        // looked right in the carousel and wrong in the video.
        drawEndCard({
          ctx, W, H, brand,
          logo: brandLogo,
          photo: lastPhoto,
          // Settle in rather than snapping — a static final frame reads as a
          // freeze, which is the one thing a video must not look like.
          reveal: ease(Math.min(1, t * 2.5))
        })
      } else {
        ctx.fillStyle = col.bg
        ctx.fillRect(0, 0, W, H)
      }
      ctx.restore()
      return
    }

    // ── Ken Burns ──
    const m = cinematic ? cinematicMotionFor(slideIndex) : motionFor(slideIndex)
    const e = ease(t)
    const scale = m.fromScale + (m.toScale - m.fromScale) * e
    const fx = m.fromX + (m.toX - m.fromX) * e
    const fy = m.fromY + (m.toY - m.fromY) * e

    const cover = Math.max(W / img.width, H / img.height) * scale
    const dw = img.width * cover
    const dh = img.height * cover
    ctx.drawImage(img, (W - dw) * fx, (H - dh) * fy, dw, dh)

    if (cinematic) {
      // Order matters: grade the image, then vignette, then bars on top —
      // a vignette applied over the bars would darken them unevenly.
      applyGrade(ctx, W, H, 1)
      applyVignette(ctx, W, H, 0.30)
      applyLetterbox(ctx, W, H, 2.39)
    }

    if (overlayLine) {
      // Text arrives after the image has settled — landing together reads as a
      // template; a beat later reads as edited.
      const textIn = ease(Math.min(1, Math.max(0, (t - 0.12) * 4)))

      const grad = ctx.createLinearGradient(0, H * 0.52, 0, H)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.76)')
      ctx.fillStyle = grad
      ctx.fillRect(0, H * 0.52, W, H * 0.48)

      ctx.globalAlpha = alpha * textIn
      ctx.font = `600 ${Math.round(62 * k)}px 'Space Grotesk', Inter, sans-serif`

      const words = overlayLine.split(' ')
      const lines: string[] = []
      let line = ''
      for (const w of words) {
        const test = line ? `${line} ${w}` : w
        if (ctx.measureText(test).width > W - PAD * 2 && line) { lines.push(line); line = w }
        else line = test
      }
      if (line) lines.push(line)

      const lh = Math.round(76 * k)
      const startY = H - PAD - (lines.length - 1) * lh - Math.round(20 * k)
      const rise = (1 - textIn) * 24 * k

      ctx.fillStyle = col.accent
      ctx.fillRect(PAD, startY - lh - Math.round(34 * k) + rise, Math.round(64 * k), Math.round(6 * k))

      ctx.fillStyle = '#FFFFFF'
      lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, PAD, startY + i * lh + rise))
    }

    ctx.restore()
  }

  async function exportVideo(
    slides: VideoSlide[],
    brand: any,
    opts: VideoOptions = {}
  ): Promise<Blob | null> {
    const support = await checkVideoSupport()
    if (!support.supported) throw new Error(support.reason)

    const fmt = FORMATS[opts.format ?? 'reel']
    const W = opts.width ?? fmt.width
    const H = opts.height ?? fmt.height
    const fps = opts.fps ?? 30
    const hold = opts.secondsPerSlide ?? 3
    const fade = opts.crossfade ?? 0.5
    const cinematic = opts.cinematic ?? false

    rendering.value = true
    progress.value = 0
    stage.value = 'Loading photos'

    try {
      // Load everything up front — decoding mid-encode stalls the pipeline and
      // shows up as dropped frames.
      const images = await Promise.all(slides.map((s) => loadImage(s.photoUrl)))
      // Load the brand logo once — the end card needs it and decoding mid-encode
      // would stall the pipeline.
      const brandLogo = brand?.logoUrl ? await loadImage(brand.logoUrl) : null
      const lastPhoto = images.filter(Boolean).slice(-1)[0] ?? null
      if (slides.some((s, i) => !s.isBrandSlide && s.photoUrl && !images[i])) {
        throw new Error('Some photos could not be loaded. They may need to be served from your own domain.')
      }

      const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')

      const target = new ArrayBufferTarget()
      const muxer = new Muxer({
        target,
        video: { codec: 'avc', width: W, height: H },
        fastStart: 'in-memory',   // playable without buffering the whole file
        firstTimestampBehavior: 'offset'
      })

      const encoder = new (window as any).VideoEncoder({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (e: any) => { throw e }
      })

      // 10 Mbps at 1080p is visibly clean — banding shows on gradients and skin
      // tones first, and that's where a lower bitrate gets noticed. But a long
      // video at 10 Mbps becomes a painful upload on mobile data, so ease it
      // down past ~30s rather than shipping a 60MB file.
      const estSeconds = slides.length * hold
      // Cinematic mode grades and vignettes, which puts smooth tonal ramps
      // across the frame — precisely where H.264 banding shows first. Worth
      // the extra bitrate; without it the grade creates visible steps in
      // walls and skies.
      const base = cinematic ? 14_000_000 : 10_000_000
      const bitrate = estSeconds > 30 ? Math.round(base * 0.78) : base

      encoder.configure({
        codec: 'avc1.42002A',
        width: W,
        height: H,
        bitrate,
        framerate: fps,
        latencyMode: 'quality'
      })

      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d', { alpha: false })!
      ctx.imageSmoothingQuality = 'high'

      const framesPerSlide = Math.round(hold * fps)
      const fadeFrames = Math.round(fade * fps)
      const totalFrames = framesPerSlide * slides.length
      let frameIndex = 0

      stage.value = 'Rendering'

      for (let s = 0; s < slides.length; s++) {
        const slide = slides[s]!
        for (let f = 0; f < framesPerSlide; f++) {
          const t = f / framesPerSlide

          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, W, H)

          // Outgoing slide still visible underneath during the crossfade.
          if (f < fadeFrames && s > 0) {
            const prev = slides[s - 1]!
            const prevT = 1
            drawFrame(ctx, images[s - 1] ?? null, W, H, prevT, s - 1, brand,
              prev.overlayLine ?? '', prev.isBrandSlide ?? false, 1, brandLogo, lastPhoto, cinematic)
          }

          const alpha = (f < fadeFrames && s > 0) ? ease(f / fadeFrames) : 1
          drawFrame(ctx, images[s] ?? null, W, H, t, s, brand,
            slide.overlayLine ?? '', slide.isBrandSlide ?? false, alpha, brandLogo, lastPhoto, cinematic)

          const frame = new (window as any).VideoFrame(canvas, {
            timestamp: (frameIndex * 1e6) / fps,
            duration: 1e6 / fps
          })
          // A keyframe every second keeps scrubbing responsive.
          encoder.encode(frame, { keyFrame: frameIndex % fps === 0 })
          frame.close()

          frameIndex++
          if (frameIndex % 5 === 0) {
            progress.value = Math.round((frameIndex / totalFrames) * 100)
            // Yield so the progress bar actually paints.
            await new Promise((r) => setTimeout(r, 0))
          }
        }
      }

      stage.value = 'Finishing'
      await encoder.flush()
      muxer.finalize()

      progress.value = 100
      return new Blob([target.buffer], { type: 'video/mp4' })
    } finally {
      rendering.value = false
      stage.value = ''
    }
  }

  return { exportVideo, checkVideoSupport, rendering, progress, stage }
}
