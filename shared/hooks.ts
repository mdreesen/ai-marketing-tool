/**
 * ============================================================================
 * HOOK BANK
 * ============================================================================
 * The first three seconds decide reach. Instagram shows a reel to a small test
 * audience and watches whether they stay — scroll past in three seconds and
 * the algorithm stops promoting it. A mediocre tour with a strong hook
 * out-performs a beautiful tour with a weak opener.
 *
 * The four mechanics that reliably work:
 *   1. OPEN LOOP    — tease something only watching resolves
 *   2. BOLD FACT    — a surprising number, stated flatly
 *   3. CALL-OUT     — name exactly who this is for
 *   4. PAYOFF       — say what they get for watching
 *
 * The one rule every source repeats: never open with "Welcome to this
 * beautiful home." It wastes the only three seconds that matter.
 *
 * `{price}`, `{beds}`, `{baths}`, `{area}`, `{sqft}` are filled from the
 * project's listing facts.
 * ============================================================================
 */

export interface HookTemplate {
  text: string
  mechanic: 'loop' | 'fact' | 'callout' | 'payoff'
  /** Which listing fields this needs. Hidden when they're not filled in. */
  needs?: string[]
  formats: string[]
}

export const HOOKS: HookTemplate[] = [
  // ── Open loop ──
  { text: "This one has a detail nobody sees coming", mechanic: 'loop', formats: ['listing_reveal','luxury_walkthrough','walkthrough'] },
  { text: "Wait until you see the kitchen", mechanic: 'loop', formats: ['listing_reveal','walkthrough'] },
  { text: "Everyone stops at the same room. Here's why", mechanic: 'loop', formats: ['listing_reveal','luxury_walkthrough'] },
  { text: "Forget the front. It's what's behind it", mechanic: 'loop', formats: ['listing_reveal','walkthrough'] },

  // ── Bold fact ──
  { text: "{price} in {area}", mechanic: 'fact', needs: ['price','neighborhood'], formats: ['listing_reveal','just_listed'] },
  { text: "{beds} bed, {baths} bath in {area} — {price}", mechanic: 'fact', needs: ['beds','baths','neighborhood','price'], formats: ['listing_reveal','just_listed'] },
  { text: "{sqft} sq ft for {price}", mechanic: 'fact', needs: ['sqft','price'], formats: ['listing_reveal'] },
  { text: "This is what {price} buys in {area}", mechanic: 'fact', needs: ['price','neighborhood'], formats: ['listing_reveal'] },

  // ── Call-out ──
  { text: "House-hunting in {area} this weekend?", mechanic: 'callout', needs: ['neighborhood'], formats: ['listing_reveal','just_listed','walkthrough'] },
  { text: "If you want space without the commute", mechanic: 'callout', formats: ['listing_reveal','walkthrough'] },
  { text: "For anyone priced out of {area}", mechanic: 'callout', needs: ['neighborhood'], formats: ['listing_reveal','price_reveal'] },
  // Price-free openers for the reveal format — anything naming the price
  // destroys the premise, so those are deliberately excluded above.
  { text: "{beds} bed, {baths} bath in {area}. What would you pay?", mechanic: 'payoff', needs: ['beds','baths','neighborhood'], formats: ['price_reveal'] },
  { text: "Comment your guess before the last slide", mechanic: 'payoff', formats: ['price_reveal'] },
  { text: "Nobody guesses this one right", mechanic: 'loop', formats: ['price_reveal'] },

  // ── Payoff ──
  { text: "Guess the price before the end", mechanic: 'payoff', formats: ['price_reveal'] },
  { text: "New listing — full tour in bio", mechanic: 'payoff', needs: [], formats: ['just_listed'] },
  { text: "Three weeks, start to finish", mechanic: 'payoff', formats: ['before_after','job_complete'] },
  { text: "What we changed, and what we kept", mechanic: 'payoff', formats: ['before_after'] }
]

/** Fill placeholders and drop hooks whose facts are missing. */
export function hooksFor(format: string, listing: Record<string, string> = {}): string[] {
  // The guess-the-price format depends entirely on withholding the price.
  // Guarding here as well as in the data, because this is the kind of thing a
  // later edit reintroduces without noticing.
  const hidePrice = format === 'price_reveal'

  const map: Record<string, string> = {
    price: hidePrice ? '' : (listing.price || ''),
    beds: listing.beds || '',
    baths: listing.baths || '',
    sqft: listing.sqft || '',
    area: listing.neighborhood || ''
  }
  const keyFor: Record<string, string> = { neighborhood: 'area' }

  return HOOKS
    .filter((h) => h.formats.includes(format))
    .filter((h) => (h.needs ?? []).every((n) => map[keyFor[n] ?? n]))
    .map((h) => h.text.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? ''))
    .filter((t) => !t.includes('{'))
}

/**
 * The facts strip — price · beds · baths · area.
 *
 * Guidance is specific about this: put it ON the visual, not on a title card,
 * "so it feels like part of the content, not a real estate ad."
 */
export function factsLine(listing: Record<string, any> = {}, hidePrice = false): string {
  const parts: string[] = []
  if (listing.price && !hidePrice) parts.push(listing.price)
  if (listing.beds) parts.push(`${listing.beds} bd`)
  if (listing.baths) parts.push(`${listing.baths} ba`)
  if (listing.sqft) parts.push(`${listing.sqft} sqft`)
  if (listing.neighborhood) parts.push(listing.neighborhood)
  return parts.join('  ·  ')
}
