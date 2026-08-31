/**
 * Ten caption options in ONE call.
 *
 * Ten separate calls would cost ten times as much and return ten variations of
 * the same sentence — the model can only make them genuinely different if it
 * writes them together.
 */
import { findViolation } from './visionAnalysis'

export interface CaptionOption {
  text: string
  hashtags: string
  tone: string
}

const TONES = [
  'straightforward', 'warm', 'proud of the work', 'story-led',
  'short and punchy', 'conversational', 'detail-focused',
  'grateful', 'behind-the-scenes', 'direct call to action'
]

function buildPrompt(theme: string, subjects: string[], postType: string, brand: any, notes: string) {
  const v = brand?.voice ?? {}

  // Distinct ANGLES, not tone adjectives. Asking for "ten captions in a warm
  // tone" returns ten rewrites of one sentence; asking for ten different
  // openings returns ten different captions.
  const angles = [
    'Open with the single most interesting detail — no preamble, no "excited to share".',
    'Tell it as a short story: what it looked like before, what changed.',
    'Lead with a number or a specific fact (weeks taken, rooms done, year built).',
    'Write it as something you would actually say out loud to a neighbour.',
    'Two sentences maximum. Say less than feels comfortable.',
    'Start mid-thought, as if continuing a conversation.',
    'Focus on one small detail most people would miss.',
    'Thank or credit someone — a client, a crew, a supplier.',
    'Behind the scenes: the part that was harder than it looks.',
    'End with one clear, low-pressure invitation to get in touch.'
  ]

  return [
    `Write 10 social media captions for a photo carousel from a ${brand?.industry || 'local'} business.`,
    ``,
    `THE POST`,
    `Type: ${postType}`,
    theme ? `What it shows: ${theme}` : '',
    subjects.length ? `Photos include: ${subjects.filter(Boolean).join(', ')}` : '',
    notes ? `What the owner told us: ${notes}` : '',
    ``,
    `WHOSE VOICE`,
    `Business: ${brand?.businessName || 'a local business'}`,
    v.tone ? `They come across as: ${v.tone}` : '',
    v.about ? `About them: ${v.about}` : '',
    v.focus ? `Known for: ${v.focus}` : '',
    v.emoji ? `Emoji: ${v.emoji}` : '',
    v.hashtags ? `Hashtags: ${v.hashtags}` : '',
    v.avoid ? `NEVER use these words or phrases: ${v.avoid}` : '',
    v.samples ? `HOW THEY ACTUALLY WRITE — match this rhythm and vocabulary:\n${v.samples}` : '',
    ``,
    `WRITE ONE CAPTION FOR EACH OF THESE ANGLES, IN ORDER:`,
    ...angles.map((a, i) => `${i + 1}. ${a}`),
    ``,
    `WHAT MAKES THESE GOOD`,
    `- Specific beats general. "Three weeks, kept the original floors" beats`,
    `  "quality craftsmanship you can trust".`,
    `- No opener that could apply to any business: not "Excited to share",`,
    `  not "Swipe to see", not "Check out this".`,
    `- No stacked adjectives. One good detail is worth five superlatives.`,
    `- Vary the LENGTH properly — some two lines, some five.`,
    `- Write like a person typing on their phone between jobs, not a brand.`,
    ``,
    `HARD RULES`,
    `- Use only what you were told. Invent nothing — no prices, no square`,
    `  footage, no materials, no timescales that weren't given.`,
    `- NEVER reference family status, children, schools, age, race, religion,`,
    `  national origin or disability, or stand-ins for them ("great for`,
    `  families", "safe neighbourhood", "perfect for a growing..."). This is a`,
    `  fair-housing requirement, not a style note.`,
    `- No fabricated urgency ("won't last", "act fast", "DM me now").`,
    `- Hashtags: 3-6, lowercase, genuinely relevant. Never #love #instagood.`,
    ``,
    `Return ONLY JSON, no fence:`,
    `{"captions":[{"text":"...","hashtags":"#one #two","tone":"short label for this angle"}]}`
  ].filter(Boolean).join('\n')
}

export async function draftCaptions(
  theme: string,
  subjects: string[],
  postType: string,
  brand: any,
  notes = ''
): Promise<CaptionOption[]> {
  const cfg = useRuntimeConfig()
  if (!process.env.ANTHROPIC_API_KEY) return []

  try {
    const res = await $fetch<any>('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: {
        model: cfg.anthropicModel,
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(theme, subjects, postType, brand, notes) }]
      }
    })

    const raw = res?.content?.find((b: any) => b.type === 'text')?.text
    if (!raw) return []

    const cleaned = raw.replace(/```json|```/g, '').trim()
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}')
    if (s === -1) return []

    const parsed = JSON.parse(cleaned.slice(s, e + 1))
    const out: CaptionOption[] = (parsed?.captions ?? [])
      .map((c: any) => ({
        text: String(c.text ?? '').trim(),
        hashtags: String(c.hashtags ?? '').trim(),
        tone: String(c.tone ?? '').trim()
      }))
      .filter((c: CaptionOption) => c.text.length > 0)

    // Drop individual offenders rather than the whole set — losing one option
    // out of ten is fine; losing all ten because of one word is not.
    const safe = out.filter((c) => {
      const v = findViolation(`${c.text} ${c.hashtags}`)
      if (v) console.error(`[captions] dropped one — protected-class language ("${v}")`)
      return !v
    })

    return safe.slice(0, 10)
  } catch (err: any) {
    console.error('[captions] failed:', err?.message || err)
    return []
  }
}
