<script setup lang="ts">
/**
 * Project card with an inline two-step delete.
 *
 * Not a browser confirm() (ugly, blocks the page) and not a modal (heavy for
 * this). The card flips to a confirm state in place, so an accidental tap
 * costs one more tap to undo and nothing is destroyed by a stray click.
 *
 * The delete control only appears on hover/focus — it shouldn't compete with
 * the card's real purpose, which is opening the post.
 */
const props = defineProps<{
  project: any
  statusLabel: string
  statusPip: string
}>()

const emit = defineEmits<{ deleted: [string] }>()

const confirming = ref(false)
const deleting = ref(false)
const toast = useToast()

/**
 * Old projects saved before naming existed still say "Untitled". Derive
 * something usable from what we know rather than showing a wall of identical
 * names — the user can rename it from the post itself.
 */
const displayName = computed(() => {
  const t = (props.project.title || '').trim()
  if (t && t.toLowerCase() !== 'untitled') return t
  const d = props.project.createdAt
    ? new Date(props.project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : ''
  return d ? `Post — ${d}` : 'Unnamed post'
})

const photoCount = computed(() => {
  const n = (props.project.assets ?? []).length
  return `${n} photo${n === 1 ? '' : 's'}`
})

// A downloaded post is safer to remove than one still in progress; say so.
const isFinished = computed(() =>
  ['exported'].includes(props.project.status)
)

async function remove() {
  deleting.value = true
  try {
    await $fetch(`/api/projects/${props.project._id}/delete`, { method: 'POST' })
    emit('deleted', props.project._id)
    toast.add({ title: 'Post deleted.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err?.data?.message || 'Could not delete that post.', color: 'error' })
    deleting.value = false
    confirming.value = false
  }
}
</script>

<template>
  <div class="pl-card-wrap">
    <!-- Confirm state -->
    <div v-if="confirming" class="pl-panel p-5 h-full flex flex-col justify-between">
      <div>
        <p class="text-[14px] font-semibold mb-1.5">Delete this post?</p>
        <p class="text-[12.5px] pl-body-c leading-relaxed">
          <template v-if="isFinished">
            The photos will be removed too. If you've already downloaded it,
            you still have those files.
          </template>
          <template v-else>
            This post isn't finished. The photos will be removed and can't be
            recovered.
          </template>
        </p>
      </div>
      <div class="flex gap-2 mt-5">
        <button
          class="pl-btn pl-btn-danger flex-1 text-[12.5px] py-2"
          :disabled="deleting"
          @click="remove"
        >
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
        <button
          class="pl-btn pl-btn-quiet flex-1 text-[12.5px] py-2"
          :disabled="deleting"
          @click="confirming = false"
        >
          Keep
        </button>
      </div>
    </div>

    <!-- Normal state -->
    <div v-else class="pl-card">
      <NuxtLink :to="`/dashboard/projects/${project._id}`" class="pl-panel pl-panel-hover p-5 block h-full">
        <div class="flex items-center justify-between mb-3">
          <span class="pl-label">{{ statusLabel }}</span>
          <span class="pl-pip" :class="statusPip" />
        </div>
        <p class="pl-display text-[16px] mb-1 truncate pr-6">{{ displayName }}</p>
        <p class="text-[13px] pl-body-c">{{ photoCount }}</p>
      </NuxtLink>

      <button
        class="pl-card-del"
        aria-label="Delete this post"
        title="Delete"
        @click.stop.prevent="confirming = true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
        </svg>
      </button>
    </div>
  </div>
</template>
