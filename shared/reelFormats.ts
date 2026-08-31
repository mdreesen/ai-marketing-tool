/**
 * ============================================================================
 * REEL FORMATS
 * ============================================================================
 * Structures that consistently perform for realtors, drawn from 2026 industry
 * guidance rather than guesswork.
 *
 * WHY FORMATS, NOT "TRENDS":
 * Trending audio and effects change weekly and can't be baked into software
 * without going stale — and we deliberately ship no audio, because platform
 * -native sound gets better reach than anything embedded. What IS durable is
 * the STRUCTURE: how long, what order, where the hook goes. Those have been
 * stable for years and are what actually decides whether a reel is watched.
 *
 * What the research consistently says:
 *   · 15-45s, with 15-30s the sweet spot
 *   · The first 2-3 seconds decide everything — hook or lose them
 *   · Lead with the STRONGEST visual, not the establishing shot
 *   · Odd-numbered lists (5, 7, 9) read as curated, not padded
 *   · Personality and local specificity beat production value
 *   · Captions carry keywords now; hashtags matter far less
 * ============================================================================
 */

export interface ReelFormat {
  value: string
  label: string
  /** One line the user sees. */
  hint: string
  /** Why this works — shown on the format card, because a reason is persuasive. */
  why: string
  industries: string[]
  /** Target length in seconds. */
  targetSeconds: number
  secondsPerSlide: number
  crossfade: number
  /** How many photos this format wants. */
  idealSlides: [number, number]
  /** Guidance passed to the AI so overlay lines match the format. */
  aiDirective: string
  /** What the first slide's text should do. */
  hookStyle: string
}

export const REEL_FORMATS: ReelFormat[] = [
  {
    value: 'price_reveal',
    label: 'Guess the price',
    hint: 'Show the home, reveal the price last',
    why: 'Agents report roughly 10x their usual engagement. People comment their guess, and comments are what push a reel past your followers.',
    industries: ['realtor'],
    targetSeconds: 20,
    secondsPerSlide: 2.0,
    crossfade: 0.35,
    idealSlides: [6, 9],
    hookStyle: 'Ask the question outright — "Guess the price before the end".',
    aiDirective:
      'Order to build toward a reveal: strongest room first to earn the watch, then the ' +
      'rest, with the most impressive space LAST. Do NOT mention or imply price in any ' +
      'overlay line — the whole format depends on withholding it. Two or three overlay ' +
      'lines maximum, and none of them should describe value or cost.'
  },
  {
    value: 'just_listed',
    label: 'Just listed teaser',
    hint: '3-5 shots, facts on screen, under 15s',
    why: 'Posted the day a listing goes live. Short enough to finish, which is the signal that earns reach.',
    industries: ['realtor'],
    targetSeconds: 13,
    secondsPerSlide: 1.6,
    crossfade: 0.2,
    idealSlides: [3, 6],
    hookStyle: 'State the facts flatly — beds, baths, area, price.',
    aiDirective:
      'This is a teaser, not a tour. Keep ONLY the 3-5 strongest photos — drop anything ' +
      'merely adequate, even if it means a short set. Lead with the most striking room, ' +
      'never the exterior. One overlay line at most; the facts strip carries the detail.'
  },
  {
    value: 'luxury_walkthrough',
    label: 'Luxury walkthrough',
    hint: 'Slow, quiet, cinematic',
    why: 'Restraint is what reads as expensive. Slow motion, long fades, almost no text — the property carries it.',
    industries: ['realtor'],
    targetSeconds: 32,
    secondsPerSlide: 4.0,
    crossfade: 1.1,
    idealSlides: [7, 10],
    hookStyle: 'One restrained line — a location or a single number. Never an adjective.',
    aiDirective:
      'Order as a considered walk-through: approach or exterior detail, entry, the main ' +
      'living space, kitchen, primary suite, then the view or outside last. Favour wide, ' +
      'composed frames over detail shots. ' +
      'CRITICAL: use AT MOST ONE overlay line in the entire set, on the first slide. ' +
      'Luxury property marketing does not caption its own photographs — text on the images ' +
      'is what makes a listing look mid-market. If a line is used it should state a fact ' +
      '(a location, an acreage, a price band), never a description of what is visible.'
  },
  {
    value: 'listing_reveal',
    label: 'Listing reveal',
    hint: 'Best shot first, then a fast walk through',
    why: 'Opening on the strongest room instead of the exterior is the single biggest change most agents can make.',
    industries: ['realtor'],
    targetSeconds: 22,
    secondsPerSlide: 1.8,
    crossfade: 0.3,
    idealSlides: [8, 12],
    hookStyle: 'A specific, concrete detail — a price band, a feature, or what makes it unusual.',
    aiDirective:
      'Order for a listing reveal: put the single most striking room FIRST (kitchen, view, ' +
      'backyard or primary suite — never the exterior). Then move quickly through the rest. ' +
      'Overlay lines: at most three across the whole set. Name what a buyer would actually ' +
      'care about — no HOA, the shop out back, the light in the mornings — not adjectives.'
  },
  {
    value: 'before_after',
    label: 'Before and after',
    hint: 'The change, not the finish',
    why: 'Renovation content gets saved more than any other format — people come back to it when planning their own.',
    industries: ['realtor', 'trades'],
    targetSeconds: 20,
    secondsPerSlide: 2.2,
    crossfade: 0.45,
    idealSlides: [6, 10],
    hookStyle: 'State the transformation up front — what it was, what it became.',
    aiDirective:
      'Order as a transformation: pair the earliest/roughest shots first, finished shots last. ' +
      'The final image must be the strongest. Overlay lines should mark the turn ("day one", ' +
      '"three weeks later") rather than describing what is visible.'
  },
  {
    value: 'walkthrough',
    label: 'Walkthrough',
    hint: 'Let the place speak — minimal text',
    why: 'Quiet, steady footage holds attention. Text on every frame is what makes a reel feel like an ad.',
    industries: ['realtor', 'church'],
    targetSeconds: 28,
    secondsPerSlide: 2.6,
    crossfade: 0.6,
    idealSlides: [8, 14],
    hookStyle: 'One line placing it — the street, the area, or the feeling.',
    aiDirective:
      'Order as a natural walk: approach, entry, main living space, kitchen, outside. ' +
      'Use AT MOST ONE overlay line across the entire set, on the first slide only. ' +
      'This format works because it is quiet.'
  },
  {
    value: 'tips_list',
    label: 'Tips list',
    hint: 'Numbered points people save',
    why: 'Odd-numbered lists read as curated rather than padded, and saves are what the algorithm rewards.',
    industries: ['realtor', 'trades', 'church', 'other'],
    targetSeconds: 24,
    secondsPerSlide: 2.4,
    crossfade: 0.35,
    idealSlides: [5, 9],
    hookStyle: 'Promise the number and the payoff: "5 things I check before I list a house".',
    aiDirective:
      'Treat each kept photo as one point in a numbered list. Aim for an ODD count (5, 7 or 9). ' +
      'EVERY slide needs an overlay line here — this is the one format where text on each frame ' +
      'is correct. Keep each to six words. Make them specific and useful, not motivational.'
  },
  {
    value: 'job_complete',
    label: 'Finished job',
    hint: 'The work, plainly shown',
    why: 'Trades buyers want proof of craft. Detail shots convince more than wide shots.',
    industries: ['trades'],
    targetSeconds: 20,
    secondsPerSlide: 2.0,
    crossfade: 0.4,
    idealSlides: [6, 10],
    hookStyle: 'What the job was, in plain words.',
    aiDirective:
      'Lead with the most satisfying finished detail, not the wide shot. Favour close work — ' +
      'joins, edges, fit — over full-room views. Overlay lines should mention what was hard or ' +
      'what was kept, never "quality craftsmanship".'
  },
  {
    value: 'event',
    label: 'Event',
    hint: 'People first, place second',
    why: 'Faces hold attention longer than rooms. Lead with the crowd, not the building.',
    industries: ['church', 'other', 'realtor'],
    targetSeconds: 18,
    secondsPerSlide: 1.8,
    crossfade: 0.3,
    idealSlides: [6, 10],
    hookStyle: 'What it is and when — concrete, not "join us for a great time".',
    aiDirective:
      'Order to lead with people and activity, not empty rooms or signage. Overlay lines carry ' +
      'the practical facts: what, when, where. Two or three across the set.'
  }
]

export function formatsFor(industry: string): ReelFormat[] {
  const i = industry || 'other'
  const matching = REEL_FORMATS.filter((f) => f.industries.includes(i))
  return matching.length ? matching : REEL_FORMATS.filter((f) => f.industries.includes('other'))
}

export function findFormat(value: string): ReelFormat | undefined {
  return REEL_FORMATS.find((f) => f.value === value)
}

