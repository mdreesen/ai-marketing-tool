<script setup lang="ts">
/**
 * Drag-and-drop / click / paste uploader.
 *
 * Three ways in, because people reach for different ones: dragging a folder
 * of photos off the desktop, tapping to browse on a phone, or pasting a
 * screenshot. All three end up in the same handler.
 *
 * Files are validated HERE rather than after upload starts, so a wrong file
 * type fails instantly instead of halfway through a slow connection.
 */
const props = defineProps<{
  uploading?: boolean
  progress?: number
  maxFiles?: number
  currentCount?: number
}>()

const emit = defineEmits<{ files: [File[]] }>()

const MAX = computed(() => props.maxFiles ?? 15)
const remaining = computed(() => Math.max(0, MAX.value - (props.currentCount ?? 0)))

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const error = ref('')

// A drag over child elements fires dragleave on the parent, so a simple
// boolean flickers. Counting enter/leave pairs is the reliable way.
let dragDepth = 0

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function isHeic(f: File) {
  const t = (f.type || '').toLowerCase()
  return t.includes('heic') || t.includes('heif') || /\.(heic|heif)$/i.test(f.name || '')
}

/**
 * Can this browser actually decode HEIC? Safari can; Chrome, Firefox and
 * Android can't. Checking once lets us warn BEFORE a long upload fails,
 * rather than after.
 */
const canDecodeHeic = ref(true)
onMounted(() => {
  const c = document.createElement('canvas')
  canDecodeHeic.value = c.toDataURL('image/heic').startsWith('data:image/heic')
    || /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
})

function validate(files: File[]): File[] {
  error.value = ''

  const images = files.filter((f) => f.type.startsWith('image/'))
  const rejected = files.length - images.length
  if (rejected > 0) {
    error.value = `${rejected} file${rejected === 1 ? '' : 's'} skipped — images only.`
  }

  const unsupported = images.filter((f) => f.type && !ACCEPTED.includes(f.type))
  if (unsupported.length) {
    // HEIC from iPhone often arrives with an empty type string; the browser
    // still decodes it on canvas, so we let empty types through.
    error.value = `${unsupported.length} file${unsupported.length === 1 ? '' : 's'} in an unsupported format.`
  }

  let usable = images.filter((f) => !f.type || ACCEPTED.includes(f.type))

  // Stop HEIC before a slow upload rather than after — and say what to do.
  if (!canDecodeHeic.value) {
    const heic = usable.filter(isHeic)
    if (heic.length) {
      usable = usable.filter((f) => !isHeic(f))
      error.value = `${heic.length} HEIC photo${heic.length === 1 ? '' : 's'} skipped — this browser can't open them. On iPhone: Settings → Camera → Formats → Most Compatible.`
    }
  }

  if (usable.length > remaining.value) {
    error.value = `Only ${remaining.value} more photo${remaining.value === 1 ? '' : 's'} can be added to this post.`
    return usable.slice(0, remaining.value)
  }
  return usable
}

function handle(files: File[]) {
  if (props.uploading) return
  const ok = validate(files)
  if (ok.length) emit('files', ok)
}

function onDrop(e: DragEvent) {
  dragDepth = 0
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  handle(files)
}

function onDragEnter() { dragDepth++; dragging.value = true }
function onDragLeave() { dragDepth = Math.max(0, dragDepth - 1); if (dragDepth === 0) dragging.value = false }

function onPick(e: Event) {
  handle(Array.from((e.target as HTMLInputElement).files ?? []))
  if (input.value) input.value.value = ''   // let the same file be re-picked
}

/** Paste a screenshot straight in — common for realtors grabbing an MLS shot. */
function onPaste(e: ClipboardEvent) {
  const files = Array.from(e.clipboardData?.items ?? [])
    .filter((i) => i.kind === 'file')
    .map((i) => i.getAsFile())
    .filter((f): f is File => Boolean(f))
  if (files.length) handle(files)
}

onMounted(() => window.addEventListener('paste', onPaste))
onBeforeUnmount(() => window.removeEventListener('paste', onPaste))
</script>

<template>
  <div>
    <div
      class="pl-drop"
      :class="{ 'is-dragging': dragging, 'is-busy': uploading }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="!uploading && input?.click()"
    >
      <input
        ref="input" type="file" accept="image/*" multiple class="hidden"
        @change="onPick"
      />

      <!-- Uploading -->
      <template v-if="uploading">
        <div class="pl-drop-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M12 3v12" stroke-linecap="round" />
            <path d="m7 8 5-5 5 5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke-linecap="round" />
          </svg>
        </div>
        <p class="pl-drop-title">Uploading… {{ progress ?? 0 }}%</p>
        <div class="pl-progress"><div class="pl-progress-fill" :style="{ width: `${progress ?? 0}%` }" /></div>
        <p class="pl-drop-sub">One at a time — steadier on a weak connection.</p>
      </template>

      <!-- Idle / dragging -->
      <template v-else>
        <div class="pl-drop-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="pl-drop-title">
          {{ dragging ? 'Drop them here' : 'Drag photos in, or click to browse' }}
        </p>
        <p class="pl-drop-sub">
          <template v-if="remaining > 0">
            Up to {{ remaining }} more · JPEG, PNG, HEIC · you can paste too
          </template>
          <template v-else>This post is full ({{ MAX }} photos).</template>
        </p>
      </template>
    </div>

    <p v-if="error" class="pl-drop-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.pl-drop {
  border: 1.5px dashed var(--hair);
  border-radius: 14px;
  background: var(--paper);
  padding: 48px 28px;
  text-align: center;
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, transform .12s ease;
}
.pl-drop:hover { border-color: var(--ink-3); background: var(--paper-2); }
.pl-drop.is-dragging {
  border-color: var(--ink);
  background: color-mix(in srgb, var(--ink) 8%, var(--paper));
  transform: scale(1.005);
}
.pl-drop.is-busy { cursor: default; border-style: solid; }

.pl-drop-icon {
  width: 52px; height: 52px; margin: 0 auto 18px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  background: var(--paper-2);
  color: var(--ink);
  border: 1px solid var(--hair);
}
.pl-drop.is-dragging .pl-drop-icon { background: var(--ink); color: var(--paper); border-color: var(--ink); }

.pl-drop-title { font-family: 'Space Grotesk', Inter, sans-serif; font-weight: 600; font-size: 17px; margin-bottom: 6px; }
.pl-drop-sub { font-size: 13px; color: var(--ink-2); }

.pl-progress { height: 3px; background: var(--hair); border-radius: 99px; margin: 16px auto 12px; max-width: 260px; overflow: hidden; }
.pl-progress-fill { height: 100%; background: var(--ink); transition: width .25s ease; }

.pl-drop-error { font-size: 12.5px; color: var(--ink); margin-top: 10px; text-align: center; }
</style>
