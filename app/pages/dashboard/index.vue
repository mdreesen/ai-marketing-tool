<script setup lang="ts">
definePageMeta({ layout: 'authenticated' })
useHead({ title: 'Postline — Your posts' })

const { data: projects, refresh } = await useFetch<any[]>('/api/projects', { key: 'projects', lazy: true })
// Same cache opt-out as the project page: this drives the "set up your
// branding" prompt, which must disappear the moment it's actually done.
const { data: brand } = await useFetch<any>('/api/brand', {
  key: 'brand',
  lazy: true,
  getCachedData: () => undefined
})

const list = computed(() => projects.value ?? [])
const creating = ref(false)

/**
 * Brand setup is a one-time task that quietly improves every post afterwards.
 * Prompting for it once, at the top, is better than burying it in a nav item
 * nobody clicks — but it disappears the moment it's done rather than nagging.
 */
const brandIncomplete = computed(() =>
  Boolean(brand.value) && !brand.value?.businessName
)

const STATUS: Record<string, { label: string; pip: string }> = {
  draft:     { label: 'Not finished', pip: 'pl-pip-idle' },
  analysing: { label: 'Working…',     pip: 'pl-pip-working' },
  ready:     { label: 'Ready',        pip: 'pl-pip-ready' },
  exported:  { label: 'Downloaded',   pip: 'pl-pip-ready' },
  failed:    { label: 'Needs a retry', pip: 'pl-pip-failed' }
}

// Anything unfinished is what they most likely came back for.
const unfinished = computed(() =>
  list.value.filter((p: any) => ['draft','analysing','ready'].includes(p.status))
)

const done = computed(() =>
  list.value.filter((p: any) => !unfinished.value.includes(p))
)

/**
 * Remove it from the list immediately rather than refetching. The server has
 * already confirmed the delete by the time this fires, so waiting on a round
 * trip would just make a successful action feel slow.
 */
function onDeleted(id: string) {
  if (projects.value) {
    projects.value = projects.value.filter((p: any) => p._id !== id)
  }
}

async function startNew() {
  creating.value = true
  try {
    const { _id } = await $fetch<{ _id: string }>('/api/projects/create', { method: 'POST' })
    await navigateTo(`/dashboard/projects/${_id}`)
  } catch (err: any) {
    creating.value = false
  }
}

</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-10">

    <header class="flex flex-wrap items-end justify-between gap-6 mb-10">
      <div>
        <p class="pl-label mb-3">Your posts</p>
        <h1 class="pl-display text-[clamp(26px,4vw,36px)] leading-tight">
          Photos in. Posts out.
        </h1>
      </div>
      <button class="pl-btn" :disabled="creating" @click="startNew">
        {{ creating ? 'Starting…' : '+ New post' }}
      </button>
    </header>

    <!-- One-time setup nudge -->
    <NuxtLink
      v-if="brandIncomplete"
      to="/dashboard/brand"
      class="pl-panel pl-panel-hover px-5 py-4 mb-8 flex items-center justify-between gap-4"
      style="border-color: color-mix(in srgb, var(--ink) 30%, transparent)"
    >
      <div>
        <p class="text-[14px] font-semibold mb-0.5">Set up your branding first</p>
        <p class="text-[13px] pl-body-c">
          Two minutes, once. It goes on every post you make after that.
        </p>
      </div>
      <span class="text-[13px] shrink-0" style="color: var(--ink)">Set up →</span>
    </NuxtLink>

    <!-- Pick up where they left off -->
    <section v-if="unfinished.length" class="mb-10">
      <p class="pl-label mb-4">Pick up where you left off</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <appProjectCard
          v-for="p in unfinished" :key="p._id"
          :project="p"
          :status-label="STATUS[p.status]?.label ?? p.status"
          :status-pip="STATUS[p.status]?.pip ?? 'pl-pip-idle'"
          @deleted="onDeleted"
        />
      </div>
    </section>

    <!-- Everything else -->
    <section v-if="done.length">
      <p class="pl-label mb-4">Done</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <appProjectCard
          v-for="p in done" :key="p._id"
          :project="p"
          :status-label="STATUS[p.status]?.label ?? p.status"
          :status-pip="STATUS[p.status]?.pip ?? 'pl-pip-idle'"
          @deleted="onDeleted"
        />
      </div>
    </section>

    <!-- First run — teaches the whole product in three lines -->
    <section v-if="!list.length" class="pl-panel p-14 text-center">
      <p class="pl-display text-[21px] mb-3">Let's make your first post</p>
      <p class="text-[14px] pl-body-c max-w-[44ch] mx-auto mb-9 leading-relaxed">
        Upload photos from a job, a listing, or an event. You'll get a finished
        carousel and ten captions to choose from.
      </p>

      <div class="grid sm:grid-cols-3 gap-5 max-w-2xl mx-auto mb-10 text-left">
        <div v-for="(s, i) in [
          { t: 'Upload', d: 'Drag in five to fifteen photos.' },
          { t: 'We build it', d: 'Best shots, in order, captions written.' },
          { t: 'Download', d: 'Post it wherever you like.' }
        ]" :key="i">
          <span class="pl-label block mb-2">Step {{ i + 1 }}</span>
          <p class="text-[14px] font-semibold mb-1">{{ s.t }}</p>
          <p class="text-[13px] pl-body-c leading-relaxed">{{ s.d }}</p>
        </div>
      </div>

      <button class="pl-btn" :disabled="creating" @click="startNew">
        {{ creating ? 'Starting…' : 'Make your first post' }}
      </button>
    </section>
  </div>
</template>
