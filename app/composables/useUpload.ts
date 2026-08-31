/**
 * Client-side compress + direct-to-storage upload.
 *
 * Compression happens BEFORE upload: a 4MB phone photo becomes ~400KB. Ten of
 * those is 4MB instead of 40MB — faster on a job-site connection, cheaper to
 * store, and vision analysis costs less because the images are smaller.
 */
const MAX_EDGE = 2000
const QUALITY = 0.85

/**
 * Canvas has a maximum drawable area. Safari caps around 16.7M pixels and will
 * silently produce a BLANK canvas past it rather than throwing — which looked
 * like "the upload just didn't work". We downscale below the cap first.
 */
const MAX_PIXELS = 12_000_000

/**
 * HEIC/HEIF is what an iPhone shoots by default. Safari can decode it; Chrome,
 * Firefox and Android cannot, and the load simply fails. Detecting it up front
 * lets us say something useful instead of reporting a mystery failure.
 */
function isHeic(file: File): boolean {
  const t = (file.type || '').toLowerCase()
  if (t.includes('heic') || t.includes('heif')) return true
  // iPhone often reports an EMPTY type, so fall back to the extension.
  return /\.(heic|heif)$/i.test(file.name || '')
}

/** Thrown with a message the user can act on. */
class UploadError extends Error {
  constructor(public fileName: string, message: string) {
    super(message)
  }
}

export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  function readImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          if (!img.width || !img.height) {
            return reject(new UploadError(file.name, 'That file is not a readable image.'))
          }
          resolve(img)
        }
        img.onerror = () => reject(new UploadError(
          file.name,
          isHeic(file)
            ? 'This browser can\'t open HEIC photos. On iPhone: Settings → Camera → Formats → Most Compatible, or open it in Safari.'
            : 'That image could not be opened. It may be damaged.'
        ))
        img.src = String(reader.result)
      }
      reader.onerror = () => reject(new UploadError(file.name, 'That file could not be read.'))
      reader.readAsDataURL(file)
    })
  }

  function compress(img: HTMLImageElement): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      // Fit the long edge, then shrink further if we're still over the canvas
      // pixel cap — a 48MP photo exceeds it even at 2000px on the long edge
      // when the other dimension is large.
      let scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
      const px = (img.width * scale) * (img.height * scale)
      if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px)

      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas unavailable.'))

      // White base so a transparent PNG doesn't flatten to black as JPEG.
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, w, h)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            return reject(new Error('That image could not be processed. Try a different one.'))
          }
          resolve({ blob, width: w, height: h })
        },
        'image/jpeg',
        QUALITY
      )
    })
  }

  async function uploadOne(projectId: string, file: File) {
    const img = await readImage(file)
    const { blob, width, height } = await compress(img)

    const { uploadUrl, key } = await $fetch<{ uploadUrl: string; key: string }>('/api/uploads/sign', {
      method: 'POST',
      body: { projectId, filename: file.name, contentType: 'image/jpeg', bytes: blob.size }
    })

    // Straight to storage — never through our server.
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg' }
    })
    if (!res.ok) throw new Error(`Upload failed (${res.status})`)

    return { key, width, height, bytes: blob.size }
  }

  /**
   * Uploads sequentially rather than in parallel. On a phone at a job site,
   * ten simultaneous uploads compete for one thin connection and time out
   * together; one at a time is slower in theory and more reliable in fact.
   */
  async function uploadAll(projectId: string, files: File[]) {
    uploading.value = true
    progress.value = 0
    const done: any[] = []
    const failed: { name: string; reason: string }[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        try {
          done.push(await uploadOne(projectId, files[i]!))
        } catch (err: any) {
          const name = files[i]?.name || 'a photo'
          console.error('[upload] failed for', name, err)
          // Keep the actual reason — "3 photos failed" with no explanation is
          // the least useful error message a user can be given.
          failed.push({
            name,
            reason: err?.message || 'Upload failed. Check your connection and try again.'
          })
        }
        progress.value = Math.round(((i + 1) / files.length) * 100)
      }

      if (done.length) {
        await $fetch(`/api/projects/${projectId}/attach`, { method: 'POST', body: { assets: done } })
      }
      return { uploaded: done.length, failed }
    } finally {
      uploading.value = false
    }
  }

  return { uploading, progress, uploadAll }
}
