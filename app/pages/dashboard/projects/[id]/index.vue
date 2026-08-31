<script setup lang="ts">
definePageMeta({ layout: 'authenticated' })

/**
 * PROJECT HUB — upload, details, then choose an output.
 *
 * Upload and AI analysis are SHARED. Making someone re-upload the same shoot
 * to get a video from it would be the wrong split, so this page owns the work
 * both outputs depend on and then hands off.
 */
const route = useRoute()
const id = route.params.id as string
const toast = useToast()
const { uploading, progress, uploadAll } = useUpload()
const { project, brand, refresh, assets, kept, captions, status, displayName } = useProject(id)

const STEPS = [
  { key: 'photos',  label: 'Photos' },
  { key: 'context', label: 'Details' },
  { key: 'output',  label: 'Make something' }
]

const analysing = ref(false)
const savingContext = ref(false)
const showAdd = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const step = computed(() => {
  if (!assets.value.length) return 0
  if (captions.value.length) return 2
  return 1
})
const isComplete = computed(() => status.value === 'exported')

const ctx = reactive({ title: '', postType: 'general', notes: '' })
watch(project, (p) => {
  if (!p) return
  ctx.title = p.title === 'Untitled' ? '' : (p.title ?? '')
  ctx.postType = p.postType ?? 'general'
  ctx.notes = p.notes ?? ''
}, { immediate: true })

const POST_TYPES = [
  { value: 'listing',      label: 'New listing',    hint: 'A property that just came on the market' },
  { value: 'just_sold',    label: 'Just sold',      hint: 'A closing worth celebrating' },
  { value: 'job_complete', label: 'Finished job',   hint: 'Work you just wrapped up' },
  { value: 'event',        label: 'Event',          hint: 'Something people should come to' },
  { value: 'general',      label: 'Something else', hint: 'General update or behind the scenes' }
]

const suggestedTitle = computed(() => {
  const label = POST_TYPES.find((t) => t.value === ctx.postType)?.label ?? 'Post'
  const d = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${label} — ${d}`
})

async function onFiles(files: File[]) {
  if (!files.length) return
  const res = await uploadAll(id, files)
  await refresh()
  showAdd.value = false

  if (res.failed.length) {
    const first = res.failed[0]
    toast.add({
      title: res.failed.length === 1
        ? `${first.name}: ${first.reason}`
        : `${res.failed.length} photos couldn't be uploaded. ${first.reason}`,
      color: 'warning'
    })
    if (res.uploaded) toast.add({ title: `${res.uploaded} added.`, color: 'success' })
  } else {
    toast.add({ title: `${res.uploaded} photo${res.uploaded === 1 ? '' : 's'} added.`, color: 'success' })
  }
}

async function saveContextAndAnalyse() {
  savingContext.value = true
  try {
    await $fetch(`/api/projects/${id}/update`, {
      method: 'POST',
      body: {
        title: (ctx.title || '').trim() || suggestedTitle.value,
        notes: ctx.notes,
        postType: ctx.postType
      }
    })
  } catch { /* the analysis matters more than the title */ }
  savingContext.value = false
  await analyse()
}

async function analyse() {
  analysing.value = true
  try {
    await $fetch(`/api/projects/${id}/analyse`, { method: 'POST' })
    await refresh()
    startPolling()
  } catch (err: any) {
    toast.add({ title: err?.data?.message || 'Could not start. Please try again.', color: 'error' })
    analysing.value = false
  }
}

/** Always resolves — a spinner that never stops is worse than an error. */
function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  let ticks = 0
  pollTimer = setInterval(async () => {
    ticks++
    await refresh()
    if (project.value?.status !== 'analysing' || ticks > 45) {
      clearInterval(pollTimer!); pollTimer = null; analysing.value = false
      if (project.value?.status === 'failed') {
        toast.add({ title: project.value?.failureReason || 'That didn\'t work.', color: 'error' })
      } else if (ticks > 45) {
        toast.add({ title: 'Taking longer than expected. Refresh in a moment.', color: 'warning' })
      }
    }
  }, 2000)
}

onMounted(() => { if (project.value?.status === 'analysing') startPolling() })
onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10">
    <header class="mb-10">
      <NuxtLink to="/dashboard" class="pl-label hover:pl-ink-c transition-colors">← All posts</NuxtLink>
      <div class="mt-5 mb-7">
        <appStepper :steps="STEPS" :current="step" :complete="isComplete" />
      </div>
    </header>

    <!-- ── PHOTOS ─────────────────────────────────── -->
    <section v-if="step === 0">
      <h1 class="pl-display text-[26px] mb-2">Add your photos</h1>
      <p class="text-[14.5px] pl-body-c mb-7 max-w-[48ch] leading-relaxed">
        Five to fifteen works best. Don't worry about picking the good ones or
        putting them in order — that's our job.
      </p>
      <appDropzone
        :uploading="uploading" :progress="progress"
        :current-count="assets.length" @files="onFiles"
      />
    </section>

    <!-- ── DETAILS ────────────────────────────────── -->
    <section v-else-if="step === 1 && status !== 'analysing'">
      <h1 class="pl-display text-[26px] mb-2">What's this about?</h1>
      <p class="text-[14.5px] pl-body-c mb-8 max-w-[52ch] leading-relaxed">
        Twenty seconds here makes a real difference to what you get back.
      </p>

      <div class="pl-panel p-6 mb-6">
        <label class="block text-[13px] pl-body-c mb-2">Name this post</label>
        <input v-model="ctx.title" class="pl-input mb-1.5" :placeholder="suggestedTitle"
          @keyup.enter="saveContextAndAnalyse" />
        <p class="text-[12px] pl-meta-c mb-7">Just so you can find it later.</p>

        <label class="block text-[13px] pl-body-c mb-3">What kind of post is this?</label>
        <div class="grid sm:grid-cols-2 gap-2.5 mb-7">
          <button
            v-for="t in POST_TYPES" :key="t.value"
            class="text-left px-4 py-3 rounded-[10px] border transition-colors"
            :style="ctx.postType === t.value
              ? { borderColor: 'var(--ink)' }
              : { borderColor: 'var(--hair)' }"
            @click="ctx.postType = t.value"
          >
            <span class="block text-[14px] font-semibold">{{ t.label }}</span>
            <span class="block text-[12px] pl-meta-c mt-0.5">{{ t.hint }}</span>
          </button>
        </div>

        <label class="block text-[13px] pl-body-c mb-2">Anything we should know?</label>
        <textarea v-model="ctx.notes" rows="3" class="pl-input resize-none"
          placeholder="Kitchen and bath remodel, took three weeks. Kept the original floors." />
        <p class="text-[12px] pl-meta-c mt-2">
          One sentence is plenty. This is what stops the captions sounding generic.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button class="pl-btn" :disabled="analysing || savingContext" @click="saveContextAndAnalyse">
          {{ analysing || savingContext ? 'Starting…' : `Build my post (${assets.length} photos)` }}
        </button>
        <button class="pl-btn pl-btn-quiet" @click="showAdd = !showAdd">
          {{ showAdd ? 'Close' : 'Add more photos' }}
        </button>
      </div>

      <appDropzone v-if="showAdd" class="mt-5"
        :uploading="uploading" :progress="progress"
        :current-count="assets.length" @files="onFiles" />
    </section>

    <!-- ── WORKING ────────────────────────────────── -->
    <section v-else-if="status === 'analysing'" class="pl-panel p-16 text-center">
      <div class="pl-spin mx-auto mb-6" />
      <p class="pl-display text-[19px] mb-2">Reading your photos</p>
      <p class="text-[13.5px] pl-body-c">
        Picking the strongest, putting them in order, writing your captions.
      </p>
    </section>

    <!-- ── FAILED ─────────────────────────────────── -->
    <section v-else-if="status === 'failed'" class="pl-panel p-14 text-center">
      <p class="pl-display text-[19px] mb-2">That didn't work</p>
      <p class="text-[13.5px] pl-body-c max-w-[42ch] mx-auto mb-7 leading-relaxed">
        {{ project?.failureReason || 'Something went wrong.' }}
        Your photos are still here — nothing was lost.
      </p>
      <button class="pl-btn" @click="analyse">Try again</button>
    </section>

    <!-- ── CHOOSE AN OUTPUT ───────────────────────── -->
    <section v-else>
      <h1 class="pl-display text-[26px] mb-2">{{ displayName }} is ready</h1>
      <p class="text-[14.5px] pl-body-c mb-9 max-w-[50ch] leading-relaxed">
        {{ kept.length }} photos picked, {{ captions.length }} captions written.
        Make one, or make both from the same set.
      </p>

      <div class="grid sm:grid-cols-2 gap-5 mb-10">
        <NuxtLink :to="`/dashboard/projects/${id}/carousel`" class="pl-panel pl-panel-hover p-7 block">
          <div class="pl-output-icon mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="3" y="5" width="12" height="14" rx="2" />
              <path d="M17 7h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" stroke-linecap="round" />
            </svg>
          </div>
          <p class="pl-display text-[18px] mb-1.5">Carousel</p>
          <p class="text-[13px] pl-body-c leading-relaxed">
            A set of images to swipe through, plus your captions. Works
            everywhere and takes seconds.
          </p>
        </NuxtLink>

        <NuxtLink :to="`/dashboard/projects/${id}/video`" class="pl-panel pl-panel-hover p-7 block">
          <div class="pl-output-icon mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="2" y="5" width="14" height="14" rx="2" />
              <path d="m16 10 6-3v10l-6-3z" stroke-linejoin="round" />
            </svg>
          </div>
          <p class="pl-display text-[18px] mb-1.5">Video</p>
          <p class="text-[13px] pl-body-c leading-relaxed">
            The same photos with slow movement and fades — an MP4 for Reels,
            TikTok or Shorts.
          </p>
        </NuxtLink>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button class="text-[12.5px] pl-body-c hover:pl-ink-c transition-colors" @click="showAdd = !showAdd">
          {{ showAdd ? 'Close' : '+ Add more photos' }}
        </button>
        <span class="text-[#232E42]">·</span>
        <button class="text-[12.5px] pl-body-c hover:pl-ink-c transition-colors" @click="analyse">
          Redo with different wording
        </button>
      </div>
      <appDropzone v-if="showAdd" class="mt-5"
        :uploading="uploading" :progress="progress"
        :current-count="assets.length" @files="onFiles" />
    </section>
  </div>
</template>
