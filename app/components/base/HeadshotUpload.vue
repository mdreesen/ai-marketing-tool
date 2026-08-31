<script setup lang="ts">
/**
 * Headshot upload.
 *
 * Crops to a centred square and compresses to 512px on a canvas BEFORE upload,
 * so a 6MB phone photo becomes ~60KB. Without this, we'd be pushing multi-
 * megabyte base64 into Mongo on every save.
 *
 * The stored image is served from our own origin, which matters for more than
 * tidiness: a cross-origin image taints the social-card canvas and makes PNG
 * export throw. Uploading here is what makes that reliable.
 */
const emit = defineEmits<{ updated: [string] }>()

const props = defineProps<{ current?: string }>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const removing = ref(false)
const preview = ref<string>('')

const shown = computed(() => preview.value || props.current || '')

const MAX_DIM = 512
const QUALITY = 0.85

/** Read a File into an HTMLImageElement. */
function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

/** Centre-crop to a square and scale down, returning a JPEG data URL. */
function squareCompress(img: HTMLImageElement): { dataUrl: string; size: number } {
  const side = Math.min(img.width, img.height)
  const sx = (img.width - side) / 2
  const sy = (img.height - side) / 2
  const size = Math.min(side, MAX_DIM)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable.')

  // White base so transparent PNGs don't turn black once flattened to JPEG.
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  return { dataUrl: canvas.toDataURL('image/jpeg', QUALITY), size }
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Please choose an image file.')
    return
  }
  // Generous guard — the compressor handles the rest.
  if (file.size > 15 * 1024 * 1024) {
    toast.error('That image is very large. Please choose one under 15MB.')
    return
  }

  uploading.value = true
  try {
    const img = await readImage(file)
    const { dataUrl, size } = squareCompress(img)
    preview.value = dataUrl

    const res = await $fetch<{ url: string }>('/api/user/headshot', {
      method: 'POST',
      body: { image: dataUrl, width: size, height: size }
    })

    await refreshNuxtData('user')
    emit('updated', res.url)
    toast.success('Headshot saved.')
  } catch (err: any) {
    preview.value = ''
    toast.error(err?.data?.message || 'Could not upload that image.')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function remove() {
  removing.value = true
  try {
    await $fetch('/api/user/headshot', { method: 'DELETE' })
    preview.value = ''
    await refreshNuxtData('user')
    emit('updated', '')
    toast.success('Headshot removed.')
  } catch {
    toast.error('Could not remove it.')
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-6">
    <!-- Preview -->
    <div class="shrink-0">
      <img
        v-if="shown"
        :src="shown"
        alt="Your headshot"
        class="w-24 h-24 rounded-full object-cover border border-[#DDD6C9]"
      />
      <div
        v-else
        class="w-24 h-24 rounded-full border border-dashed border-[#DDD6C9] flex items-center justify-center text-[11px] uppercase tracking-[0.1em] text-[#A9A39A] text-center px-2"
      >
        No photo
      </div>
    </div>

    <div class="min-w-0">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFile"
      />

      <div class="flex flex-wrap gap-2.5">
        <button
          :disabled="uploading"
          class="px-5 py-3 border border-[#DDD6C9] text-[11px] uppercase tracking-[0.1em] text-[#8A847C] hover:border-[#1F1B16] hover:text-[#1F1B16] transition-colors disabled:opacity-40"
          @click="fileInput?.click()"
        >
          {{ uploading ? 'Uploading…' : shown ? 'Replace photo' : 'Upload a photo' }}
        </button>

        <button
          v-if="shown"
          :disabled="removing"
          class="px-5 py-3 border border-[#DDD6C9] text-[11px] uppercase tracking-[0.1em] text-[#A9A39A] hover:border-[#B5563A] hover:text-[#B5563A] transition-colors disabled:opacity-40"
          @click="remove"
        >
          Remove
        </button>
      </div>

      <p class="text-[12px] text-[#A9A39A] mt-3 leading-relaxed max-w-[42ch]">
        Cropped to a square automatically. Used on your emails and social cards.
      </p>
    </div>
  </div>
</template>
