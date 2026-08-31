<script setup lang="ts">
/**
 * Logo / headshot upload for the brand end card.
 *
 * Compresses to PNG rather than JPEG: logos usually have transparency, and
 * flattening one onto white puts a visible box around it on a dark end card.
 * That's the single most common way a "branded" slide ends up looking wrong.
 */
const props = defineProps<{
  currentUrl?: string
  label?: string
  hint?: string
}>()

const emit = defineEmits<{ uploaded: [string] }>()

const input = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref('')
const preview = ref('')

const shown = computed(() => preview.value || props.currentUrl || '')

// Logos are line art — they stay sharp small, and this keeps the file tiny.
const MAX_EDGE = 800

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('That image could not be opened.'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('That file could not be read.'))
    reader.readAsDataURL(file)
  })
}

function compress(img: HTMLImageElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('Canvas unavailable.'))

    // NO white fill — transparency is the point for a logo.
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)

    canvas.toBlob(
      (blob) => blob && blob.size ? resolve(blob) : reject(new Error('Could not process that image.')),
      'image/png'
    )
  })
}

async function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  error.value = ''
  busy.value = true
  try {
    if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')

    const img = await readImage(file)
    const blob = await compress(img)
    preview.value = URL.createObjectURL(blob)

    const { uploadUrl, key } = await $fetch<{ uploadUrl: string; key: string }>('/api/uploads/sign', {
      method: 'POST',
      body: { scope: 'brand', filename: 'logo.png', contentType: 'image/png', bytes: blob.size }
    })

    const res = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/png' } })
    if (!res.ok) throw new Error(`Upload failed (${res.status})`)

    emit('uploaded', key)
  } catch (err: any) {
    preview.value = ''
    error.value = err?.message || 'Could not upload that.'
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}

function clear() {
  preview.value = ''
  emit('uploaded', '')
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-[13px] pl-body-c mb-2.5">{{ label }}</label>

    <div class="flex items-center gap-4">
      <!-- Checkerboard shows transparency honestly -->
      <div class="pl-slide w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden">
        <img v-if="shown" :src="shown" class="max-w-[80%] max-h-[80%] object-contain" alt="" />
        <span v-else class="text-[10px] pl-meta-c text-center px-2">None</span>
      </div>

      <div class="min-w-0">
        <input ref="input" type="file" accept="image/*" class="hidden" @change="onPick" />
        <div class="flex flex-wrap gap-2">
          <button class="pl-btn pl-btn-quiet text-[12.5px] py-2" :disabled="busy" @click="input?.click()">
            {{ busy ? 'Uploading…' : shown ? 'Replace' : 'Upload' }}
          </button>
          <button v-if="shown" class="pl-btn pl-btn-quiet text-[12.5px] py-2" :disabled="busy" @click="clear">
            Remove
          </button>
        </div>
        <p v-if="hint" class="text-[11.5px] pl-meta-c mt-2 leading-relaxed max-w-[38ch]">{{ hint }}</p>
      </div>
    </div>

    <p v-if="error" class="text-[12px] mt-2.5" style="color: var(--ink)">{{ error }}</p>
  </div>
</template>
