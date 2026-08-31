<script setup lang="ts">
import { drawEndCard } from '~/utils/drawEndCard'
import { factsLine } from '~/utils/hooks'

/**
 * SLIDE COMPOSER
 *
 * Draws one carousel slide and exports a PNG. Composition happens in the
 * BROWSER — free per render, instant preview, no render farm.
 *
 * CRITICAL: photos must be same-origin or the canvas is tainted and
 * toDataURL() throws. See STORAGE.md.
 */

interface Props {
  photoUrl?: string
  overlayLine?: string
  index?: number
  total?: number
  brand?: any
  isBrandSlide?: boolean
  /** Listing facts strip — price · beds · baths · area. */
  listing?: Record<string, any>
  /** Hide the price (guess-the-price format). */
  hidePrice?: boolean
  /** Bold opening frame. The first three seconds decide reach. */
  isHook?: boolean
  hookText?: string
  /** Preview width; height follows the brand's chosen ratio. */
  width?: number
  /** Optional per-slide overrides, so one slide can differ from the brand default. */
  templateOverride?: string
  focalX?: number   // 0-1, horizontal crop centre
  focalY?: number   // 0-1, vertical crop centre
}
const props = withDefaults(defineProps<Props>(), {
  photoUrl: '', overlayLine: '', index: 0, total: 1,
  brand: () => ({}), isBrandSlide: false, width: 1080,
  listing: () => ({}), hidePrice: false, isHook: false, hookText: '',
  templateOverride: '', focalX: 0.5, focalY: 0.5
})

const canvas = ref<HTMLCanvasElement | null>(null)

/**
 * Guards against out-of-order async renders.
 *
 * render() awaits image loads, so two quick prop changes can overlap and the
 * OLDER one may finish last — leaving the canvas showing the previous brand.
 * Each run takes a token; if a newer run has started by the time this one is
 * ready to paint, it bails.
 */
let renderToken = 0

/** Cache decoded images so switching template/colour doesn't refetch the photo. */
const imageCache = new Map<string, HTMLImageElement | null>()

/** Output shape. 4:5 is the tallest ratio the feed won't crop. */
const RATIOS: Record<string, number> = { portrait: 1350 / 1080, square: 1, story: 1920 / 1080 }

const FONTS: Record<string, { display: string; body: string }> = {
  modern:    { display: "'Space Grotesk', Inter, sans-serif", body: "Inter, sans-serif" },
  editorial: { display: "Georgia, 'Times New Roman', serif",  body: "Inter, sans-serif" },
  classic:   { display: "Georgia, serif",                     body: "Georgia, serif" },
  bold:      { display: "'Arial Black', Impact, sans-serif",  body: "Inter, sans-serif" }
}

const b = computed(() => props.brand ?? {})
const ratio = computed(() => RATIOS[b.value.ratio] ?? RATIOS.portrait)
const template = computed(() => props.templateOverride || b.value.template || 'clean')
const fonts = computed(() => FONTS[b.value.fontPair] ?? FONTS.modern)

const colors = computed(() => {
  const c = b.value.colors ?? {}
  const ok = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v || '')
  return {
    // Literal hex, NOT css variables — canvas fillStyle can't resolve var().
    // These are the monochrome defaults; a brand's own colours still win.
    bg: ok(c.bg) ? c.bg : '#FAFAF8',
    fg: ok(c.fg) ? c.fg : '#121211',
    accent: ok(c.accent) ? c.accent : '#121211'
  }
})

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url) ?? null)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imageCache.set(url, img); resolve(img) }
    img.onerror = () => { imageCache.set(url, null); resolve(null) }
    img.src = url
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  for (const para of String(text).split('\n')) {
    if (!para.trim()) { out.push(''); continue }
    let line = ''
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = word }
      else line = test
    }
    if (line) out.push(line)
  }
  return out
}

/**
 * Cover-fit with a FOCAL POINT rather than a blind centre crop.
 *
 * Centre-cropping a tall photo of a house cuts the roof off. Letting the user
 * nudge the focal point is the difference between a usable slide and one they
 * throw away — and it's something the generic tools make you do by hand.
 */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  const x = (w - dw) * Math.min(1, Math.max(0, props.focalX))
  const y = (h - dh) * Math.min(1, Math.max(0, props.focalY))
  ctx.drawImage(img, x, y, dw, dh)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function render() {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return

  const token = ++renderToken
  // Any awaited work below may be overtaken; check the token before painting.
  const stale = () => token !== renderToken

  const W = props.width
  const H = Math.round(W * ratio.value)
  c.width = W; c.height = H

  const k = W / 1080
  const PAD = Math.round(72 * k)
  const col = colors.value
  const f = fonts.value

  ctx.fillStyle = col.bg
  ctx.fillRect(0, 0, W, H)

  // ── Final branding slide ──────────────────────────────
  // Delegated to utils/drawEndCard so the carousel and the video can never
  // drift apart again — they were two separate implementations.
  if (props.isBrandSlide) {
    const logo = (b.value.endCard?.showLogo !== false && b.value.logoUrl)
      ? await loadImage(b.value.logoUrl)
      : null
    if (stale()) return

    const photo = b.value.endCard?.usePhoto && props.photoUrl
      ? await loadImage(props.photoUrl)
      : null
    if (stale()) return

    drawEndCard({ ctx, W, H, brand: b.value, logo, photo, reveal: 1, fonts: f })
    return
  }

  // ── Photo slide ───────────────────────────────────────
  const img = await loadImage(props.photoUrl)
  if (stale()) return

  // 'frame' insets the photo inside the brand colour
  const inset = template.value === 'frame' ? Math.round(46 * k) : 0
  if (img) {
    ctx.save()
    if (inset) { roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, Math.round(12 * k)); ctx.clip() }
    ctx.translate(inset, inset)
    drawCover(ctx, img, W - inset * 2, H - inset * 2)
    ctx.restore()
  } else {
    ctx.fillStyle = '#E8E7E2'
    ctx.fillRect(inset, inset, W - inset * 2, H - inset * 2)
  }

  const line = props.overlayLine
  if (line) {
    const pos = b.value.textPosition || 'bottom'
    const scrim = Math.min(100, Math.max(0, b.value.scrimStrength ?? 72)) / 100

    ctx.font = `600 ${Math.round(56 * k)}px ${f.display}`
    const lines = wrapText(ctx, line, W - PAD * 2 - inset * 2).slice(0, 3)
    const lh = Math.round(68 * k)
    const blockH = lines.length * lh

    let textY: number
    if (pos === 'top') textY = PAD + inset + Math.round(60 * k)
    else if (pos === 'centre') textY = H / 2 - blockH / 2 + lh
    else textY = H - PAD - inset - blockH + lh

    // ── Template treatments ──
    if (template.value === 'banner') {
      // Solid bar behind the text — maximum legibility on a busy photo
      const barY = textY - lh + Math.round(6 * k)
      const barH = blockH + Math.round(44 * k)
      ctx.fillStyle = col.bg
      ctx.globalAlpha = 0.92
      ctx.fillRect(inset, barY - Math.round(22 * k), W - inset * 2, barH)
      ctx.globalAlpha = 1
    } else if (template.value === 'corner') {
      // Tight card in the corner — leaves the photo almost untouched
      ctx.font = `600 ${Math.round(42 * k)}px ${f.display}`
      const cardLines = wrapText(ctx, line, W * 0.52).slice(0, 3)
      const clh = Math.round(52 * k)
      const cw = W * 0.6
      const ch = cardLines.length * clh + Math.round(44 * k)
      const cx = PAD + inset
      const cy = H - PAD - inset - ch
      ctx.fillStyle = col.bg
      ctx.globalAlpha = 0.94
      roundRect(ctx, cx, cy, cw, ch, Math.round(10 * k))
      ctx.fill()
      ctx.globalAlpha = 1

      if (b.value.showAccentRule !== false) {
        ctx.fillStyle = col.accent
        ctx.fillRect(cx, cy, Math.round(5 * k), ch)
      }
      ctx.fillStyle = col.fg
      cardLines.forEach((l, i) =>
        ctx.fillText(l, cx + Math.round(26 * k), cy + Math.round(46 * k) + i * clh))

      drawWatermark(ctx, W, H, PAD, k, f, inset)
      return
    } else if (template.value !== 'editorial') {
      // 'clean' / 'frame' — gradient scrim only where the text sits, so the
      // photo isn't flattened by a full-frame darkening.
      const from = pos === 'top' ? 0 : (pos === 'centre' ? H * 0.25 : H * 0.5)
      const to = pos === 'top' ? H * 0.5 : (pos === 'centre' ? H * 0.75 : H)
      const grad = ctx.createLinearGradient(0, pos === 'top' ? to : from, 0, pos === 'top' ? from : to)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, `rgba(0,0,0,${scrim})`)
      ctx.fillStyle = grad
      ctx.fillRect(inset, Math.min(from, to), W - inset * 2, Math.abs(to - from))
    }

    // Editorial puts the words on a colour block below the image instead
    if (template.value === 'editorial') {
      const blockTop = H - Math.round(300 * k)
      ctx.fillStyle = col.bg
      ctx.fillRect(0, blockTop, W, H - blockTop)
      textY = blockTop + Math.round(90 * k)
      if (b.value.showAccentRule !== false) {
        ctx.fillStyle = col.accent
        ctx.fillRect(PAD, blockTop + Math.round(44 * k), Math.round(56 * k), Math.round(5 * k))
      }
    } else if (b.value.showAccentRule !== false && template.value !== 'banner') {
      ctx.fillStyle = col.accent
      ctx.fillRect(PAD + inset, textY - lh - Math.round(26 * k), Math.round(56 * k), Math.round(5 * k))
    }

    ctx.fillStyle = template.value === 'editorial' || template.value === 'banner' ? col.fg : '#FFFFFF'
    ctx.font = `600 ${Math.round(56 * k)}px ${f.display}`
    lines.forEach((l, i) => ctx.fillText(l, PAD + inset, textY + i * lh))
  }

  // ── Facts strip ──
  // Guidance is specific: put price/beds/baths/area ON the visual, not on a
  // title card, "so it feels like part of the content, not a real estate ad."
  const facts = factsLine(props.listing, props.hidePrice)
  if (facts) {
    ctx.font = `600 ${Math.round(27 * k)}px ${f.body}`
    const fw = ctx.measureText(facts).width
    const bh = Math.round(56 * k)
    const bx = PAD + inset
    const by = H - PAD - inset - bh

    ctx.fillStyle = 'rgba(0,0,0,0.62)'
    roundRect(ctx, bx - Math.round(18 * k), by, fw + Math.round(36 * k), bh, Math.round(4 * k))
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(facts, bx, by + bh / 2 + Math.round(10 * k))
  }

  // ── Hook frame ──
  // A bold opening statement, not a caption. This is the gate that decides
  // whether anyone sees the rest.
  if (props.isHook && props.hookText) {
    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    ctx.fillRect(0, 0, W, H)

    ctx.font = `700 ${Math.round(78 * k)}px ${f.display}`
    const lines = wrapText(ctx, props.hookText, W - PAD * 2).slice(0, 4)
    const lh = Math.round(92 * k)
    const startY = H / 2 - ((lines.length - 1) * lh) / 2

    ctx.fillStyle = '#FFFFFF'
    lines.forEach((l, i) => ctx.fillText(l, PAD, startY + i * lh))
  }

  drawWatermark(ctx, W, H, PAD, k, f, inset)
}

function drawWatermark(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  PAD: number, k: number, f: any, inset: number
) {
  if (b.value.watermark === false) return
  const name = b.value.businessName
  if (!name) return
  ctx.fillStyle = '#FFFFFF'
  ctx.globalAlpha = 0.8
  ctx.font = `600 ${Math.round(24 * k)}px ${f.body}`
  ctx.textAlign = 'right'
  ctx.fillText(name, W - PAD - inset, PAD + inset + Math.round(20 * k))
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
}

async function toPng(): Promise<string | null> {
  // Force a fresh paint at export time so the file matches what's on screen,
  // even if a brand change landed since the last render.
  await render()
  await nextTick()
  try {
    return canvas.value?.toDataURL('image/png') ?? null
  } catch {
    console.error('[slide] canvas tainted — photos must be same-origin')
    return null
  }
}

watch(
  () => [props.photoUrl, props.overlayLine, props.brand, props.isBrandSlide,
         props.templateOverride, props.focalX, props.focalY, props.width],
  render, { deep: true }
)
onMounted(render)
defineExpose({ render, toPng })
</script>

<template>
  <canvas ref="canvas" class="pl-slide w-full h-auto block" />
</template>
