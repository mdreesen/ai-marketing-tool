<script setup lang="ts">
definePageMeta({ layout: 'authenticated' })

/**
 * CAROUSEL — review slides, pick a caption, download images.
 * Split from the video page so neither screen has to explain the other.
 */
const route = useRoute()
const id = route.params.id as string
const toast = useToast()
const { project, brand, refresh, update, assets, kept, dropped, captions, slides, displayName } = useProject(id)

const exporting = ref(false)
const slideRefs = ref<any[]>([])

useHead({ title: () => `${displayName.value} — Carousel` })

async function toggleKeep(asset: any) {
  const next = assets.value.map((a: any) => a.key === asset.key ? { ...a, keep: !a.keep } : a)
  await update({ assets: next })
}

async function chooseCaption(i: number) {
  const next = captions.value.map((c: any, idx: number) => ({ ...c, chosen: idx === i }))
  await update({ captions: next })
}

async function copyCaption(c: any) {
  const text = [c.text, c.hashtags].filter(Boolean).join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Caption copied.', color: 'success' })
  } catch {
    toast.add({ title: 'Copy didn\'t work — select the text and copy it manually.', color: 'error' })
  }
}

async function download() {
  exporting.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    let failed = 0

    for (let i = 0; i < slides.value.length; i++) {
      const cmp = slideRefs.value[i]
      if (!cmp?.toPng) continue
      const dataUrl = await cmp.toPng()
      if (!dataUrl) { failed++; continue }
      zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, dataUrl.split(',')[1], { base64: true })
    }

    if (failed === slides.value.length) {
      toast.add({
        title: 'Download failed — photos need to be served from your own domain. See STORAGE.md.',
        color: 'error'
      })
      return
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${displayName.value.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`
    a.click()
    URL.revokeObjectURL(a.href)

    await update({ status: 'exported' })
    toast.add({ title: 'Downloaded. Post them in order, oldest first.', color: 'success' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Could not build the download.', color: 'error' })
  } finally {
    exporting.value = false
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
        <h1 class="pl-display text-[26px] mt-3">Carousel</h1>
        <p class="text-[14px] pl-body-c mt-1">
          {{ slides.length }} slides · {{ captions.length }} captions
        </p>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <NuxtLink :to="`/dashboard/projects/${id}/video`" class="pl-btn pl-btn-quiet">
          Make a video instead
        </NuxtLink>
        <button class="pl-btn" :disabled="exporting" @click="download">
          {{ exporting ? 'Building…' : 'Download images' }}
        </button>
      </div>
    </header>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
      <div v-for="(s, i) in slides" :key="i" class="relative">
        <appSlideCanvas
          :ref="(el: any) => { if (el) slideRefs[i] = el }"
          :photo-url="s.photoUrl" :overlay-line="s.overlayLine"
          :is-brand-slide="s.isBrandSlide" :brand="brand"
          :listing="project?.listing ?? {}"
          :hide-price="Boolean(project?.listing?.revealPrice) && !s.isBrandSlide"
          :width="540"
        />
        <span class="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/65 text-white">
          {{ s.isBrandSlide ? 'End card' : i + 1 }}
        </span>
      </div>
    </div>

    <div v-if="dropped.length" class="mb-12">
      <p class="pl-label mb-2">Left out ({{ dropped.length }})</p>
      <p class="text-[13px] pl-meta-c mb-4 max-w-[52ch] leading-relaxed">
        These didn't make the cut. Tap any to put it back in.
      </p>
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <button v-for="a in dropped" :key="a.key" class="text-left" @click="toggleKeep(a)">
          <img :src="a.url" class="pl-slide pl-slide-dropped w-full aspect-[4/5] object-cover" />
          <p class="text-[11px] pl-meta-c mt-1.5 leading-snug">{{ a.dropReason || 'Not used' }}</p>
        </button>
      </div>
    </div>

    <div>
      <p class="pl-label mb-2">Pick a caption</p>
      <p class="text-[13px] pl-meta-c mb-5 max-w-[52ch] leading-relaxed">
        Ten options, all in your voice. Copy the one you like — edit it first if you want to.
      </p>

      <div v-if="captions.length" class="space-y-3">
        <div
          v-for="(c, i) in captions" :key="i"
          class="pl-panel p-5 cursor-pointer transition-colors"
          :style="c.chosen ? { borderColor: 'var(--ink)' } : {}"
          @click="chooseCaption(i)"
        >
          <div class="flex items-start justify-between gap-4 mb-2.5">
            <span class="pl-label">{{ c.tone }}</span>
            <button class="text-[12px] font-semibold shrink-0 hover:opacity-70"
              style="color: var(--ink)" @click.stop="copyCaption(c)">Copy</button>
          </div>
          <p class="text-[14px] leading-relaxed whitespace-pre-line">{{ c.text }}</p>
          <p v-if="c.hashtags" class="text-[12.5px] pl-meta-c mt-2.5">{{ c.hashtags }}</p>
        </div>
      </div>
    </div>

    <div class="pl-panel p-6 mt-12">
      <p class="pl-label mb-4">Posting it</p>
      <ol class="space-y-2.5 text-[13.5px] pl-body-c">
        <li><span class="pl-ink-c">1.</span> Download — you'll get a folder of images.</li>
        <li><span class="pl-ink-c">2.</span> In Instagram or Facebook, create a post and select all of them.</li>
        <li><span class="pl-ink-c">3.</span> Keep them in order — the file names are numbered.</li>
        <li><span class="pl-ink-c">4.</span> Paste your caption and post.</li>
      </ol>
    </div>
  </div>
</template>
