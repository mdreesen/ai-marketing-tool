<script setup lang="ts">
definePageMeta({ layout: 'authenticated' })

/**
 * VIDEO — the same photos, rendered as an MP4 with motion.
 *
 * On its own page because the decisions here (shape, pace, length against
 * platform limits) have nothing to do with picking a caption, and mixing them
 * made both screens harder to read.
 */
const route = useRoute()
const id = route.params.id as string
const toast = useToast()
const { project, brand, kept, slides, displayName } = useProject(id)

/** Formats grounded in what actually performs, not fleeting trends. */
const formats = computed(() => formatsFor(project.value?.industry || brand.value?.industry || 'other'))
const chosenFormat = ref('')

// Default to the format matching what they said the post was about.
watch([project, formats], () => {
  if (chosenFormat.value || !formats.value.length) return
  const byType: Record<string, string> = {
    listing: 'listing_reveal', just_sold: 'listing_reveal',
    job_complete: 'job_complete', event: 'event', general: 'tips_list'
  }
  const want = byType[project.value?.postType ?? 'general']
  chosenFormat.value = formats.value.find((f) => f.value === want)?.value ?? formats.value[0]!.value
}, { immediate: true })

const activeFormat = computed(() => findFormat(chosenFormat.value))

/** Pace adapts to photo count so a format keeps its intended length. */
const adaptivePace = computed(() =>
  activeFormat.value
    ? paceFor(activeFormat.value, slides.value.length)
    : SETTINGS[pace.value]
)
const {
  exportVideo, checkVideoSupport,
  rendering, progress, stage
} = useVideoExport()

useHead({ title: () => `${displayName.value} — Video` })

const support = ref<{ supported: boolean; reason: string }>({ supported: true, reason: '' })
const format = ref<'reel' | 'square' | 'feed'>('reel')
const pace = ref<'snappy' | 'natural' | 'relaxed'>('natural')
const done = ref(false)

const FORMATS = [
  { value: 'reel',   label: 'Reel',   ratio: '9:16', hint: 'Reels, TikTok, Shorts' },
  { value: 'square', label: 'Square', ratio: '1:1',  hint: 'Feed' },
  { value: 'feed',   label: 'Tall',   ratio: '4:5',  hint: 'Feed, more screen' }
]
const PACES = [
  { value: 'snappy',  label: 'Snappy',  seconds: 1.4, hint: 'Fast cuts' },
  { value: 'natural', label: 'Natural', seconds: 2.4, hint: 'Reads comfortably' },
  { value: 'relaxed', label: 'Relaxed', seconds: 3.4, hint: 'Time to take each shot in' }
]

const SETTINGS = {
  snappy:  { secondsPerSlide: 1.4, crossfade: 0.25 },
  natural: { secondsPerSlide: 2.4, crossfade: 0.4 },
  relaxed: { secondsPerSlide: 3.4, crossfade: 0.6 }
}

const duration = computed(() =>
  +(slides.value.length * adaptivePace.value.secondsPerSlide).toFixed(1)
)
const sizeMb = computed(() => +(duration.value * (duration.value > 30 ? 7.5 : 10) / 8).toFixed(1))

/**
 * Instagram Stories cap at 15 seconds per card. Saying so BEFORE rendering
 * avoids someone waiting a minute for a file the platform will truncate.
 */
const overStory = computed(() => duration.value > 15)
const overReel = computed(() => duration.value > 90)

onMounted(async () => { support.value = await checkVideoSupport() })

async function render() {
  done.value = false
  try {
    const blob = await exportVideo(
      slides.value.map((s: any) => ({
        photoUrl: s.photoUrl,
        overlayLine: s.overlayLine,
        isBrandSlide: s.isBrandSlide
      })),
      brand.value,
      { format: format.value, ...adaptivePace.value }
    )
    if (!blob) throw new Error('Nothing was produced.')

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${displayName.value.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)

    done.value = true
    toast.add({ title: 'Video downloaded.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err?.message || 'Could not make the video.', color: 'error' })
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <header class="flex flex-wrap items-start justify-between gap-4 mb-9">
      <div class="min-w-0">
        <NuxtLink :to="`/dashboard/projects/${id}`" class="pl-label hover:pl-ink-c transition-colors">
          ← {{ displayName }}
        </NuxtLink>
        <h1 class="pl-display text-[26px] mt-3">Video</h1>
        <p class="text-[14px] pl-body-c mt-1">
          {{ kept.length }} photos with slow movement and fades
        </p>
      </div>
      <NuxtLink :to="`/dashboard/projects/${id}/carousel`" class="pl-btn pl-btn-quiet shrink-0">
        Make a carousel instead
      </NuxtLink>
    </header>

    <!-- Unsupported browser: say so once, clearly, and offer the alternative -->
    <div v-if="!support.supported" class="pl-panel p-10 text-center">
      <p class="pl-display text-[18px] mb-2">Video isn't available here</p>
      <p class="text-[13.5px] pl-body-c max-w-[44ch] mx-auto mb-7 leading-relaxed">
        {{ support.reason }}
      </p>
      <NuxtLink :to="`/dashboard/projects/${id}/carousel`" class="pl-btn">Make a carousel instead</NuxtLink>
    </div>

    <template v-else>
      <div class="grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <label class="block text-[13px] pl-body-c mb-2.5">Shape</label>
          <div class="grid sm:grid-cols-3 gap-2.5 mb-7">
            <button
              v-for="f in FORMATS" :key="f.value"
              class="text-left px-4 py-3 rounded-[10px] border transition-colors"
              :style="format === f.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="format = f.value as any"
            >
              <span class="block text-[14px] font-semibold">{{ f.label }}</span>
              <span class="block text-[11.5px] pl-meta-c mt-0.5">{{ f.ratio }} · {{ f.hint }}</span>
            </button>
          </div>

          <label class="pl-label" style="display:block;margin-bottom:12px">Format</label>
          <div class="grid sm:grid-cols-2 gap-2.5 mb-3">
            <button
              v-for="f in formats" :key="f.value"
              class="pl-choice"
              :data-selected="chosenFormat === f.value"
              @click="chosenFormat = f.value"
            >
              <span class="pl-choice-title">{{ f.label }}</span>
              <span class="pl-choice-hint">{{ f.hint }}</span>
            </button>
          </div>
          <p v-if="activeFormat" class="pl-meta mb-7" style="max-width:56ch">
            {{ activeFormat.why }}
            <template v-if="slides.length < activeFormat.idealSlides[0]">
              Works best with {{ activeFormat.idealSlides[0] }}–{{ activeFormat.idealSlides[1] }} photos —
              you have {{ slides.length }}.
            </template>
          </p>

          <label class="block text-[13px] pl-body-c mb-2.5">Pace</label>
          <div class="grid sm:grid-cols-3 gap-2.5 mb-7">
            <button
              v-for="p in PACES" :key="p.value"
              class="text-left px-4 py-3 rounded-[10px] border transition-colors"
              :style="pace === p.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="pace = p.value as any"
            >
              <span class="block text-[14px] font-semibold">{{ p.label }}</span>
              <span class="block text-[11.5px] pl-meta-c mt-0.5">
                {{ (slides.length * p.seconds).toFixed(0) }}s · {{ p.hint }}
              </span>
            </button>
          </div>

          <div v-if="rendering" class="mb-7">
            <div class="flex justify-between text-[12.5px] pl-body-c mb-2">
              <span>{{ stage }}</span><span>{{ progress }}%</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--hair)">
              <div class="h-full transition-all" :style="{ width: `${progress}%`, background: 'var(--ink)' }" />
            </div>
            <p class="text-[11.5px] pl-meta-c mt-2">
              Rendering on your machine — keep this tab open.
            </p>
          </div>

          <button class="pl-btn" :disabled="rendering" @click="render">
            {{ rendering ? 'Rendering…' : done ? 'Render again' : 'Render and download' }}
          </button>
        </div>

        <!-- What you're about to get, stated before you wait for it -->
        <aside>
          <p class="pl-label mb-3">What you'll get</p>
          <div class="pl-panel p-5 space-y-3.5 text-[13px]">
            <div class="flex justify-between">
              <span class="pl-body-c">Length</span>
              <span class="font-semibold">{{ duration }}s</span>
            </div>
            <div class="flex justify-between">
              <span class="pl-body-c">Slides</span>
              <span class="font-semibold">{{ slides.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="pl-body-c">File size</span>
              <span class="font-semibold">~{{ sizeMb }} MB</span>
            </div>
            <div class="flex justify-between">
              <span class="pl-body-c">Format</span>
              <span class="font-semibold">MP4 · 1080p</span>
            </div>
          </div>

          <div class="mt-5 space-y-2.5">
            <p class="pl-label mb-2">Fits</p>
            <div v-for="p in [
              { name: 'TikTok', ok: true },
              { name: 'Reels', ok: !overReel },
              { name: 'YouTube Shorts', ok: duration <= 60 },
              { name: 'Instagram Story', ok: !overStory }
            ]" :key="p.name" class="flex items-center gap-2.5 text-[13px]">
              <span class="pl-pip shrink-0" :class="p.ok ? 'pl-pip-ready' : 'pl-pip-failed'" />
              <span :class="p.ok ? 'pl-body-c' : 'pl-meta-c'">{{ p.name }}</span>
              <span v-if="!p.ok" class="text-[11.5px] pl-meta-c">too long</span>
            </div>
            <p v-if="overStory" class="text-[11.5px] leading-relaxed pt-1" style="color: var(--ink)">
              Choose Snappy to fit a 15-second Story.
            </p>
          </div>

          <p class="text-[11.5px] pl-meta-c mt-6 leading-relaxed">
            No music included — add it in Instagram or TikTok. Their audio gets
            better reach than a baked-in track.
          </p>
        </aside>
      </div>
    </template>
  </div>
</template>
