/**
 * ============================================================================
 * SHARED END-CARD RENDERER
 * ============================================================================
 * ONE implementation, used by both the carousel (SlideCanvas.vue) and the video
 * (useVideoExport.ts).
 *
 * WHY THIS EXISTS: the video had its own simplified copy that read only the
 * headline and CTA — no logo, no layout, no background mode, no contact line.
 * So a brand configured on the Brand page looked right in the carousel and
 * wrong in the video. Two renderers for the same thing always drift; this is
 * the third time that pattern has bitten this project.
 * ============================================================================
 */

export interface EndCardOpts {
  ctx: CanvasRenderingContext2D
  W: number
  H: number
  brand: any
  logo: HTMLImageElement | null
  photo?: HTMLImageElement | null
  /** 0-1. Video passes an eased value so the card settles in; carousel passes 1. */
  reveal?: number
  fonts?: { display: string; body: string }
}

const DEFAULT_FONTS = {
  display: "'Inter', -apple-system, sans-serif",
  body: "'Inter', -apple-system, sans-serif"
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

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of String(text).split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = word }
    else line = test
  }
  if (line) out.push(line)
  return out
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

const LOGO_BOX: Record<string, number> = { small: 140, medium: 210, large: 300 }

export function drawEndCard({ ctx, W, H, brand, logo, photo, reveal = 1, fonts }: EndCardOpts) {
  const b = brand ?? {}
  const ec = b.endCard ?? {}
  const f = fonts ?? DEFAULT_FONTS
  const k = W / 1080
  const PAD = Math.round(72 * k)

  const ok = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v || '')
  const col = {
    bg: ok(b.colors?.bg) ? b.colors.bg : '#FAFAF8',
    fg: ok(b.colors?.fg) ? b.colors.fg : '#121211',
    accent: ok(b.colors?.accent) ? b.colors.accent : '#121211'
  }

  const layout = ec.layout || 'centred'
  const showLogo = ec.showLogo !== false && !!logo
  const logoBox = Math.round((LOGO_BOX[ec.logoSize] ?? LOGO_BOX.medium) * k)

  // Background
  const bgFill = ec.background === 'accent' ? col.accent
    : ec.background === 'ink' ? '#121211'
    : col.bg
  ctx.fillStyle = bgFill
  ctx.fillRect(0, 0, W, H)

  if (ec.usePhoto && photo) {
    drawCover(ctx, photo, W, H)
    ctx.fillStyle = ec.background === 'accent' ? `${col.accent}D9` : 'rgba(12,12,11,0.84)'
    ctx.fillRect(0, 0, W, H)
  }

  const onDark = ec.background === 'accent' || ec.background === 'ink' || (ec.usePhoto && photo)
  const textCol = onDark ? '#FFFFFF' : col.fg
  const accentCol = onDark ? '#FFFFFF' : col.accent

  const name = (ec.headline || '').trim() || b.businessName || ''
  const tagline = (ec.subline || '').trim() || b.tagline || ''
  const cta = ec.cta || ''
  const contact = [
    ec.showPhone !== false ? b.contact?.phone : '',
    ec.showWebsite !== false ? b.contact?.website : '',
    ec.showHandle === true ? b.contact?.handle : ''
  ].filter(Boolean).join('   ·   ')

  // Video passes an eased reveal so the final frame settles rather than snapping.
  ctx.globalAlpha = reveal
  const rise = (1 - reveal) * 24 * k

  const placeLogo = (cx: number, top: number, box: number) => {
    if (!logo) return 0
    const s = Math.min(box / logo.width, box / logo.height)
    const lw = logo.width * s
    const lh = logo.height * s
    ctx.drawImage(logo, cx - lw / 2, top, lw, lh)
    return lh
  }

  // ── minimal ──
  if (layout === 'minimal') {
    ctx.textAlign = 'center'
    ctx.fillStyle = textCol
    ctx.font = `600 ${Math.round(66 * k)}px ${f.display}`
    ctx.fillText(name, W / 2, H / 2 + Math.round(20 * k) + rise)
    if (cta) {
      ctx.fillStyle = accentCol
      ctx.font = `500 ${Math.round(30 * k)}px ${f.body}`
      ctx.fillText(cta, W / 2, H / 2 + Math.round(78 * k) + rise)
    }
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
    return
  }

  // ── split ──
  if (layout === 'split') {
    const bandY = H * 0.62
    ctx.fillStyle = onDark ? 'rgba(0,0,0,0.22)' : col.accent
    ctx.fillRect(0, bandY, W, H - bandY)

    if (showLogo) placeLogo(W / 2, bandY / 2 - logoBox / 2 - Math.round(30 * k), logoBox)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `600 ${Math.round(52 * k)}px ${f.display}`
    ctx.fillText(name, W / 2, bandY + Math.round(90 * k) + rise)

    if (cta) {
      ctx.font = `500 ${Math.round(30 * k)}px ${f.body}`
      ctx.globalAlpha = reveal * 0.92
      ctx.fillText(cta, W / 2, bandY + Math.round(142 * k) + rise)
      ctx.globalAlpha = reveal
    }
    if (contact) {
      ctx.font = `400 ${Math.round(24 * k)}px ${f.body}`
      ctx.globalAlpha = reveal * 0.8
      ctx.fillText(contact, W / 2, H - PAD)
      ctx.globalAlpha = reveal
    }
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
    return
  }

  // ── stacked ──
  if (layout === 'stacked') {
    let y = H * 0.34
    if (showLogo && logo) {
      const s = Math.min(logoBox / logo.width, (logoBox * 0.66) / logo.height)
      ctx.drawImage(logo, PAD, y - logo.height * s, logo.width * s, logo.height * s)
    }

    ctx.fillStyle = accentCol
    ctx.fillRect(PAD, y + Math.round(36 * k) + rise, Math.round(56 * k), Math.round(5 * k))

    ctx.fillStyle = textCol
    ctx.font = `600 ${Math.round(58 * k)}px ${f.display}`
    const nameLines = wrap(ctx, name, W - PAD * 2).slice(0, 2)
    nameLines.forEach((l, i) =>
      ctx.fillText(l, PAD, y + Math.round(112 * k) + i * Math.round(66 * k) + rise))
    y += Math.round(112 * k) + nameLines.length * Math.round(66 * k)

    if (tagline) {
      ctx.globalAlpha = reveal * 0.72
      ctx.font = `400 ${Math.round(30 * k)}px ${f.body}`
      ctx.fillText(tagline, PAD, y + Math.round(14 * k) + rise)
      ctx.globalAlpha = reveal
      y += Math.round(50 * k)
    }
    if (cta) {
      ctx.fillStyle = accentCol
      ctx.font = `600 ${Math.round(32 * k)}px ${f.body}`
      ctx.fillText(cta, PAD, y + Math.round(46 * k) + rise)
    }
    if (contact) {
      ctx.fillStyle = textCol
      ctx.globalAlpha = reveal * 0.62
      ctx.font = `400 ${Math.round(24 * k)}px ${f.body}`
      ctx.fillText(contact, PAD, H - PAD)
      ctx.globalAlpha = reveal
    }
    ctx.globalAlpha = 1
    return
  }

  // ── centred (default) ──
  ctx.textAlign = 'center'
  if (showLogo) {
    placeLogo(W / 2, H / 2 - Math.round(150 * k) - logoBox / 2, logoBox)
  }

  ctx.fillStyle = textCol
  ctx.font = `600 ${Math.round(62 * k)}px ${f.display}`
  ctx.fillText(name, W / 2, H / 2 + Math.round(56 * k) + rise)

  if (tagline) {
    ctx.fillStyle = accentCol
    ctx.font = `500 ${Math.round(30 * k)}px ${f.body}`
    ctx.fillText(tagline, W / 2, H / 2 + Math.round(112 * k) + rise)
  }

  if (cta) {
    ctx.font = `600 ${Math.round(30 * k)}px ${f.body}`
    const tw = ctx.measureText(cta).width
    const pw = tw + Math.round(64 * k)
    const ph = Math.round(72 * k)
    const px = (W - pw) / 2
    const py = H / 2 + Math.round(168 * k) + rise

    ctx.fillStyle = onDark ? 'rgba(255,255,255,0.18)' : col.accent
    roundRect(ctx, px, py, pw, ph, ph / 2)
    ctx.fill()

    ctx.fillStyle = onDark ? '#FFFFFF' : (col.accent === '#121211' ? '#FAFAF8' : '#FFFFFF')
    ctx.fillText(cta, W / 2, py + ph / 2 + Math.round(11 * k))
  }

  if (contact) {
    ctx.fillStyle = textCol
    ctx.globalAlpha = reveal * 0.62
    ctx.font = `400 ${Math.round(26 * k)}px ${f.body}`
    ctx.fillText(contact, W / 2, H - PAD)
  }

  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
}
