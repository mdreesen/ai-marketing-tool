import { fetchAsBase64 } from './storage'

/**
 * ============================================================================
 * VISION ANALYSIS
 * ============================================================================
 * ONE call for the whole set, not one per photo. Batching matters twice over:
 * it costs a fraction as much, and the model can only judge "which of these
 * belong together and in what order" if it sees them together.
 *
 * GUARDRAILS — carried from GhostForm's leadAnalysis.ts:
 *   - Fair housing applies to realtor customers. No family/school/"safe
 *     neighbourhood" language. Forbidden in the prompt AND scanned afterwards,
 *     because a model will write it helpfully unless you stop it twice.
 *   - Never invent facts. No prices, square footage or features not visible.
 *   - No fabricated urgency.
 * ============================================================================
 */

export interface PhotoVerdict {
  index: number
  keep: boolean
  dropReason: string
  order: number
  subject: string
  quality: 'strong' | 'usable' | 'weak'
  overlayLine: string
}

export interface ProjectAnalysis {
  theme: string
  hookLine: string
  closingLine: string
  photos: PhotoVerdict[]
  model: string
}

/**
 * Language that must never reach the user. Tuned so genuine property
 * vocabulary survives — "single-family" and "multi-family" are property types,
 * "a growing family" is a protected-class reference.
 */
const FORBIDDEN: RegExp[] = [
  /(?<!\b(single|multi)[\s-])\bfamil(y|ies|ial)\b/i,
  /\bkids?\b/i, /\bchildren\b/i, /\bschool district/i, /\bschools?\b/i,
  /\bmarried\b/i, /\bcouple\b/i,
  /\bsingle\b(?![\s-]*(story|storey|level|family|wide))/i,
  /\bethnic/i, /\brace\b/i, /\bracial/i, /\breligio/i, /\bchurch-goer/i,
  /\bnationalit/i, /\bimmigran/i, /\bdisab/i, /\bhandicap/i,
  /\belderly\b/i, /\bretire(d|e|ment)\b/i, /\bpregnan/i,
  /\bsafe neighborhood/i, /\bsafe neighbourhood/i, /\bgood area for\b/i,
  /\bperfect for a\b/i
]

export function findViolation(text: string): string | null {
  for (const re of FORBIDDEN) {
    const m = text.match(re)
    if (m) return m[0]
  }
  return null
}

/** Strip any line that violates; if the core lines are unusable, fall back. */
function sanitise(a: ProjectAnalysis): ProjectAnalysis {
  const clean = { ...a }
  for (const field of ['theme', 'hookLine', 'closingLine'] as const) {
    const v = findViolation(String(clean[field] ?? ''))
    if (v) {
      console.error(`[vision] discarded ${field} — protected-class language ("${v}")`)
      clean[field] = ''
    }
  }
  clean.photos = a.photos.map((p) => {
    const v = findViolation(p.overlayLine || '')
    if (v) {
      console.error(`[vision] discarded overlay for photo ${p.index} ("${v}")`)
      return { ...p, overlayLine: '' }
    }
    return p
  })
  return clean
}

function buildPrompt(
  count: number, postType: string, industry: string, notes: string,
  formatDirective = '', hookStyle = ''
): string {
  return [
    `You are choosing and sequencing ${count} photos into a social carousel for a ${industry} business.`,
    `Post type: ${postType}.`,
    notes ? `What the owner told us: ${notes}` : '',
    ``,
    // The format decides ordering and how much text belongs on the images.
    // Without this the model applies the same generic treatment to a quiet
    // walkthrough and a numbered tips list, which want opposite things.
    formatDirective ? `FORMAT — follow this closely:\n${formatDirective}` : '',
    hookStyle ? `The first slide's hook should: ${hookStyle}` : '',
    formatDirective ? `` : '',
    `JUDGE EACH PHOTO HONESTLY. Most people upload several near-duplicates and`,
    `a couple of genuinely bad frames. Dropping those is the most valuable thing`,
    `you do — a carousel of six strong photos beats twelve mixed ones.`,
    ``,
    `For each photo:`,
    `- keep: false if it is blurry, badly lit, cluttered, a near-duplicate of a`,
    `  better frame, or simply weaker than the rest. Aim to keep 5-8.`,
    `- dropReason: plain and specific — "blurry", "same angle as photo 3 but`,
    `  darker", "hand in frame". The owner sees this, so make it useful.`,
    `- order: sequence for posting.`,
    `    * Slide 1 must be the STRONGEST image. It is the only one most people`,
    `      will see, and it decides whether they swipe.`,
    `    * Then build a narrative — wide establishing shot, then detail, then`,
    `      the payoff. Do not just order them by quality.`,
    `- subject: 1-3 words for what it shows.`,
    `- quality: strong | usable | weak`,
    `- overlayLine: SIX WORDS MAX, or "" for none.`,
    `    * MOST PHOTOS SHOULD HAVE NO OVERLAY. Text on every slide looks like a`,
    `      template and buries the photography. Two or three across the whole`,
    `      set is right.`,
    `    * When you do add one, say something the photo cannot: "three weeks,`,
    `      start to finish", not "beautiful kitchen".`,
    `    * Never a caption of what is visible. Never an exclamation mark.`,
    ``,
    `For the set:`,
    `- theme: one line on what this carousel is actually about.`,
    `- hookLine: text for slide 1. Its only job is to stop the scroll. Concrete`,
    `  and specific — a number, a surprise, or a question worth answering.`,
    `- closingLine: the line before their branding. A reason to make contact,`,
    `  stated calmly.`,
    ``,
    `HARD RULES`,
    `- Describe ONLY what is visible. No prices, sizes, materials, brands or`,
    `  dates you cannot see and were not told. Inventing a detail is worse than`,
    `  saying less — the owner will be asked about it.`,
    `- NEVER reference or imply family status, children, schools, marital`,
    `  status, age, race, ethnicity, national origin, religion or disability,`,
    `  including proxies ("great for families", "safe neighbourhood", "perfect`,
    `  for a growing..."). Fair-housing requirement, not a preference.`,
    `- No fabricated urgency. No exclamation marks.`,
    ``,
    `Return ONLY JSON, no markdown fence:`,
    `{"theme":"...","hookLine":"...","closingLine":"...","photos":[{"index":0,`,
    `"keep":true,"dropReason":"","order":0,"subject":"...","quality":"strong",`,
    `"overlayLine":""}]}`
  ].filter(Boolean).join('\n')
}

async function callAnthropic(prompt: string, images: { data: string; mime: string }[]) {
  const cfg = useRuntimeConfig()
  const content: any[] = images.map((img) => ({
    type: 'image',
    source: { type: 'base64', media_type: img.mime, data: img.data }
  }))
  content.push({ type: 'text', text: prompt })

  const res = await $fetch<any>('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': cfg.anthropicKey as string,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: {
      model: cfg.anthropicModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content }]
    }
  })
  return res?.content?.find((b: any) => b.type === 'text')?.text ?? null
}

function parseJson(raw: string): any | null {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}')
    if (s === -1 || e === -1) return null
    return JSON.parse(cleaned.slice(s, e + 1))
  } catch { return null }
}

/** Deterministic fallback so a failed AI call never blocks the user. */
export function fallbackAnalysis(count: number): ProjectAnalysis {
  return {
    theme: '',
    hookLine: '',
    closingLine: '',
    model: 'fallback',
    photos: Array.from({ length: count }, (_, i) => ({
      index: i, keep: true, dropReason: '', order: i,
      subject: '', quality: 'usable' as const, overlayLine: ''
    }))
  }
}

export async function analysePhotos(
  keys: string[],
  postType: string,
  industry: string,
  notes = '',
  formatDirective = '',
  hookStyle = ''
): Promise<ProjectAnalysis> {
  const cfg = useRuntimeConfig()
  if (!cfg.anthropicKey) return fallbackAnalysis(keys.length)

  // Cap what we send. Beyond ~12 the cost climbs and the ordering advice gets
  // vague — and a 20-photo carousel is a bad post anyway.
  const capped = keys.slice(0, 12)
  const images: { data: string; mime: string }[] = []
  for (const key of capped) {
    const img = await fetchAsBase64(key)
    if (img) images.push(img)
  }
  if (!images.length) return fallbackAnalysis(keys.length)

  try {
    const raw = await callAnthropic(
      buildPrompt(images.length, postType, industry, notes, formatDirective, hookStyle),
      images
    )
    if (!raw) return fallbackAnalysis(keys.length)

    const parsed = parseJson(raw)
    if (!parsed?.photos?.length) return fallbackAnalysis(keys.length)

    const result: ProjectAnalysis = {
      theme: String(parsed.theme ?? ''),
      hookLine: String(parsed.hookLine ?? ''),
      closingLine: String(parsed.closingLine ?? ''),
      model: String(cfg.anthropicModel),
      photos: parsed.photos.map((p: any, i: number) => ({
        index: Number(p.index ?? i),
        keep: p.keep !== false,
        dropReason: String(p.dropReason ?? ''),
        order: Number(p.order ?? i),
        subject: String(p.subject ?? ''),
        quality: ['strong','usable','weak'].includes(p.quality) ? p.quality : 'usable',
        overlayLine: String(p.overlayLine ?? '').slice(0, 60)
      }))
    }
    return sanitise(result)
  } catch (err: any) {
    console.error('[vision] analysis failed:', err?.message || err)
    return fallbackAnalysis(keys.length)
  }
}
