/**
 * Scroll-driven reveal system.
 *
 * Any element with `.gf-depth` rotates up out of depth into place when it
 * enters the viewport (CSS does the transition; this adds `.in`). Any
 * descendant with `data-count` counts up at the same time.
 *
 * IMPORTANT: elements can appear LONG after the initial scan — anything behind
 * a `v-if` waiting on lazy-fetched data (charts, tables, conditional sections)
 * mounts later. Because `.gf-depth` starts at opacity:0, a late-mounting block
 * that never gets observed stays permanently invisible. A MutationObserver
 * watches for those and observes them as they appear.
 *
 * Also reveals anything already sitting in the viewport immediately, so
 * above-the-fold content never waits for a scroll event that may never come.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  function runCount(el: HTMLElement) {
    if (el.dataset.done) return
    el.dataset.done = '1'

    const target = parseFloat(el.dataset.count || '0')
    const decimals = parseInt(el.dataset.dec || '0', 10)
    const suffix = el.dataset.suffix || ''

    if (reduced) {
      el.textContent = target.toFixed(decimals) + suffix
      return
    }

    const start = performance.now() + 150
    const duration = 1100

    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      el.textContent = (target * eased).toFixed(decimals) + suffix
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  function reveal(el: HTMLElement) {
    el.classList.add('in')
    el.querySelectorAll<HTMLElement>('[data-count]').forEach(runCount)
  }

  let observer: IntersectionObserver | null = null

  function getObserver() {
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            reveal(entry.target as HTMLElement)
            observer?.unobserve(entry.target)
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      )
    }
    return observer
  }

  function track(el: HTMLElement) {
    if (el.classList.contains('in') || el.dataset.gfTracked) return
    el.dataset.gfTracked = '1'

    if (reduced) { reveal(el); return }

    // If it's already on screen (late-mounting content usually is), reveal
    // right away rather than waiting for a scroll that may never happen.
    const r = el.getBoundingClientRect()
    const onScreen = r.top < window.innerHeight && r.bottom > 0
    if (onScreen && r.height > 0) {
      requestAnimationFrame(() => reveal(el))
      return
    }

    getObserver().observe(el)
  }

  function scan(root: ParentNode = document) {
    root.querySelectorAll<HTMLElement>('.gf-depth:not(.in)').forEach(track)
  }

  // Watch for blocks that mount later (v-if on lazy data, route changes, etc.)
  let mo: MutationObserver | null = null
  function watch() {
    if (mo) return
    mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.classList?.contains('gf-depth')) track(node)
          node.querySelectorAll?.<HTMLElement>('.gf-depth:not(.in)').forEach(track)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }

  nuxtApp.hook('app:mounted', () => {
    nextTick(() => { scan(); watch() })
  })
  nuxtApp.hook('page:finish', () => {
    nextTick(scan)
  })

  // Safety net: re-scan shortly after load in case anything slipped through
  // (slow lazy fetches, hydration timing).
  if (import.meta.client) {
    setTimeout(() => scan(), 600)
    setTimeout(() => scan(), 2000)
  }
})
