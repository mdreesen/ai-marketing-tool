/**
 * Shared project state.
 *
 * Extracted so the carousel and video pages don't each re-implement fetching,
 * slide derivation, and brand handling. Three copies of "which photos did we
 * keep, and in what order" is three places for them to disagree.
 */
export function useProject(id: string) {
  const { data: project, refresh } = useFetch<any>(`/api/projects/${id}`, {
    key: `project-${id}`,
    lazy: true
  })

  /**
   * Brand must never come from the payload cache — editing your brand and
   * returning to a post used to render the old one. Same fix as before.
   */
  const { data: brand, refresh: refreshBrand } = useFetch<any>('/api/brand', {
    key: 'brand',
    lazy: true,
    getCachedData: () => undefined
  })

  const assets = computed(() =>
    (project.value?.assets ?? []).slice().sort((a: any, b: any) => a.order - b.order)
  )
  const kept = computed(() => assets.value.filter((a: any) => a.keep))
  const dropped = computed(() => assets.value.filter((a: any) => !a.keep))
  const captions = computed(() => project.value?.captions ?? [])
  const status = computed(() => project.value?.status ?? 'draft')
  const isReady = computed(() => captions.value.length > 0 || kept.value.length > 0)

  /** Kept photos plus the branding end card — the shape both outputs use. */
  const slides = computed(() => [
    ...kept.value.map((a: any) => ({
      photoUrl: a.url,
      overlayLine: a.overlayLine,
      isBrandSlide: false
    })),
    { photoUrl: kept.value[kept.value.length - 1]?.url ?? '', overlayLine: '', isBrandSlide: true }
  ])

  const displayName = computed(() => {
    const t = (project.value?.title || '').trim()
    if (t && t.toLowerCase() !== 'untitled') return t
    const d = project.value?.createdAt
      ? new Date(project.value.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : ''
    return d ? `Post — ${d}` : 'Unnamed post'
  })

  async function update(body: Record<string, any>) {
    await $fetch(`/api/projects/${id}/update`, { method: 'POST', body })
    await refresh()
  }

  return {
    project, brand, refresh, refreshBrand, update,
    assets, kept, dropped, captions, status, isReady, slides, displayName
  }
}
