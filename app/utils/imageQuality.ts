/**
 * ============================================================================
 * IMAGE QUALITY
 * ============================================================================
 * The difference between "photos in a video" and something that looks shot.
 * ============================================================================
 */

/**
 * MULTI-STEP DOWNSCALE — the single biggest quality win available.
 *
 * Drawing a 4000px photo straight into a 1080px canvas makes the browser do a
 * ~4x reduction in one bilinear pass. Bilinear only samples 2x2 pixels, so at
 * that ratio it skips most of the source: fine detail turns to shimmer, and
 * straight edges (window frames, siding, tile grout) alias into stair-steps.
 * It's the specific reason a sharp photo can look soft in an exported video.
 *
 * Halving repeatedly means every pass is a 2x reduction — exactly what bilinear
 * handles well. Costs a few milliseconds per image, once, and the difference is
 * clearly visible on any architectural shot.
 */
export function downscaleStepped(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  let srcW = img.width
  let srcH = img.height

  let canvas = document.createElement('canvas')
  canvas.width = srcW
  canvas.height = srcH
  let ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0)

  // Halve until one more halving would undershoot the target.
  while (srcW / 2 >= targetW && srcH / 2 >= targetH) {
    const nextW = Math.floor(srcW / 2)
    const nextH = Math.floor(srcH / 2)

    const next = document.createElement('canvas')
    next.width = nextW
    next.height = nextH
    const nctx = next.getContext('2d')!
    nctx.imageSmoothingEnabled = true
    nctx.imageSmoothingQuality = 'high'
    nctx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, nextW, nextH)

    canvas = next
    ctx = nctx
    srcW = nextW
    srcH = nextH
  }

  // Final pass to the exact size — now a reduction of less than 2x.
  const out = document.createElement('canvas')
  out.width = targetW
  out.height = targetH
  const octx = out.getContext('2d')!
  octx.imageSmoothingEnabled = true
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, targetW, targetH)
  return out
}

/**
 * A restrained grade. Lifts contrast slightly and warms the midtones — the
 * treatment property photography usually gets anyway.
 *
 * Deliberately subtle. An obvious filter reads as amateur; this should be
 * invisible until you compare side by side.
 */
export function applyGrade(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  strength = 1
) {
  // Slight S-curve via a soft-light style overlay: darken the edges of the
  // tonal range without crushing either end.
  ctx.save()

  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.10 * strength
  ctx.fillStyle = '#8899AA'    // cools the shadows a touch
  ctx.fillRect(0, 0, W, H)

  ctx.globalCompositeOperation = 'soft-light'
  ctx.globalAlpha = 0.12 * strength
  ctx.fillStyle = '#FFE8CC'    // warms the highlights
  ctx.fillRect(0, 0, W, H)

  ctx.restore()
}

/**
 * Vignette. Draws the eye toward the middle of the frame, which is what makes
 * a still feel composed rather than captured.
 */
export function applyVignette(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  strength = 0.28
) {
  const grad = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.32,
    W / 2, H / 2, Math.max(W, H) * 0.75
  )
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}

/**
 * Cinematic letterbox — a 2.39:1 window inside a 9:16 frame.
 *
 * This is the cheapest signal of "film" there is, and it's honest: it doesn't
 * pretend the footage is something it isn't, it just frames it deliberately.
 * Also solves a real problem — it gives text somewhere to live that isn't on
 * top of the photograph.
 */
export function applyLetterbox(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  ratio = 2.39
) {
  const visibleH = W / ratio
  const barH = Math.max(0, (H - visibleH) / 2)
  if (barH <= 0) return { top: 0, bottom: H, barH: 0 }

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, barH)
  ctx.fillRect(0, H - barH, W, barH)

  return { top: barH, bottom: H - barH, barH }
}
