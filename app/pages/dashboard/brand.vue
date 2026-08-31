<script setup lang="ts">
definePageMeta({ layout: 'authenticated' })
useHead({ title: 'Postline — Brand' })

const toast = useToast()
const { data: brand, refresh } = await useFetch<any>('/api/brand', { key: 'brand', lazy: true })
const saving = ref(false)
const logoUrl = ref('')

function onLogo(key: string) {
  form.logoKey = key
  // Optimistic local preview; the real URL comes back on next load.
  if (!key) logoUrl.value = ''
}

const form = reactive({
  businessName: '', tagline: '',
  colors: { bg: 'var(--paper)', fg: 'var(--ink)', accent: 'var(--ink)' },
  contact: { phone: '', website: '', handle: '' },
  fontPair: 'modern',
  template: 'clean',
  textPosition: 'bottom',
  scrimStrength: 72,
  ratio: 'portrait',
  watermark: true,
  showAccentRule: true,
  logoKey: '',
  endCard: {
    layout: 'centred', headline: '', subline: '', cta: '',
    background: 'brand', usePhoto: false,
    showLogo: true, logoSize: 'medium',
    showPhone: true, showWebsite: true, showHandle: false
  },
  voice: { tone: 'warm', about: '', focus: '', emoji: 'some', hashtags: 'few', avoid: '', samples: '' }
})

const END_LAYOUTS = [
  { value: 'centred', label: 'Centred', hint: 'Everything stacked in the middle' },
  { value: 'stacked', label: 'Stacked', hint: 'Left aligned, like an article' },
  { value: 'split',   label: 'Split',   hint: 'Colour band across the bottom' },
  { value: 'minimal', label: 'Minimal', hint: 'Name and your ask only' }
]
const END_BACKGROUNDS = [
  { value: 'brand',  label: 'Brand colour' },
  { value: 'accent', label: 'Accent' },
  { value: 'ink',    label: 'Near black' }
]

/** Suggestions by trade — a blank CTA box is the hardest field to fill in. */
/**
 * "Comment a keyword" CTAs are what agents report actually converting views
 * into DMs — a comment is a public engagement signal AND opens a conversation,
 * where "link in bio" does neither. Listed first for that reason.
 */
const CTA_IDEAS: Record<string, string[]> = {
  realtor: ['Book a showing', 'Call for a free valuation', 'Ask me about this street'],
  trades:  ['Call for a free estimate', 'Book your quote', 'See more of our work'],
  church:  ['Join us Sunday', 'Everyone welcome', 'Find service times'],
  other:   ['Get in touch', 'Send us a message', 'See more']
}
const ctaIdeas = computed(() => CTA_IDEAS[brand.value?.industry] ?? CTA_IDEAS.other)

const TEMPLATES = [
  { value: 'clean',     label: 'Clean',     hint: 'Soft fade behind the words' },
  { value: 'banner',    label: 'Banner',    hint: 'Solid bar — clearest on busy photos' },
  { value: 'corner',    label: 'Corner',    hint: 'Small card, photo stays visible' },
  { value: 'frame',     label: 'Frame',     hint: 'Photo inset in your colour' },
  { value: 'editorial', label: 'Editorial', hint: 'Words below the image' }
]
const FONTS = [
  { value: 'modern',    label: 'Modern',    hint: 'Clean and current' },
  { value: 'editorial', label: 'Editorial', hint: 'Serif headline, sans body' },
  { value: 'classic',   label: 'Classic',   hint: 'Traditional throughout' },
  { value: 'bold',      label: 'Bold',      hint: 'Heavy, high impact' }
]
const RATIOS = [
  { value: 'portrait', label: '4:5',  hint: 'Feed — tallest without cropping' },
  { value: 'square',   label: '1:1',  hint: 'Classic square' },
  { value: 'story',    label: '9:16', hint: 'Stories and Reels' }
]

watch(brand, (b) => {
  if (!b) return
  form.businessName = b.businessName ?? ''
  form.tagline = b.tagline ?? ''
  Object.assign(form.colors, b.colors ?? {})
  Object.assign(form.contact, b.contact ?? {})
  Object.assign(form.voice, b.voice ?? {})
  form.fontPair = b.fontPair ?? 'modern'
  form.template = b.template ?? 'clean'
  form.textPosition = b.textPosition ?? 'bottom'
  form.scrimStrength = b.scrimStrength ?? 72
  form.ratio = b.ratio ?? 'portrait'
  form.watermark = b.watermark !== false
  form.showAccentRule = b.showAccentRule !== false
  form.logoKey = b.logoKey ?? ''
  Object.assign(form.endCard, b.endCard ?? {})
  // The preview needs a URL, not a storage key.
  logoUrl.value = b.logoUrl ?? ''
}, { immediate: true })

/** Live preview source — the form as it stands, not the saved record. */
const previewBrand = computed(() => ({ ...form, logoUrl: logoUrl.value }))

async function save() {
  saving.value = true
  try {
    await $fetch('/api/brand/update', { method: 'POST', body: { ...form } })
    // Update our own copy AND the shared 'brand' payload, so any page already
    // holding that key sees the new values rather than a stale snapshot.
    await refresh()
    await refreshNuxtData('brand')
    toast.add({ title: 'Brand saved.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err?.data?.message || 'Could not save.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-10">
    <p class="pl-label mb-3">Brand</p>
    <h1 class="pl-display text-[30px] mb-2">How your posts look and sound.</h1>
    <p class="text-[14px] pl-body-c mb-10 max-w-[54ch] leading-relaxed">
      Set this once. Every carousel and caption uses it, so your feed stays
      consistent without you thinking about it.
    </p>

    <section class="pl-panel p-7 mb-6">
      <p class="pl-label mb-5">The basics</p>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Business name</label>
          <input v-model="form.businessName" class="pl-input" placeholder="White Raven Realty" />
        </div>
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Tagline</label>
          <input v-model="form.tagline" class="pl-input" placeholder="Flathead Valley, Montana" />
        </div>
      </div>
    </section>

    <section class="pl-panel p-7 mb-6">
      <p class="pl-label mb-5">Colours</p>
      <div class="grid grid-cols-3 gap-5">
        <div v-for="(label, key) in { bg: 'Background', fg: 'Text', accent: 'Accent' }" :key="key">
          <label class="block text-[12px] pl-body-c mb-2">{{ label }}</label>
          <div class="flex gap-2">
            <input v-model="(form.colors as any)[key]" type="color" class="h-[44px] w-12 bg-transparent border pl-hair-c rounded cursor-pointer" />
            <input v-model="(form.colors as any)[key]" class="pl-input min-w-0 flex-1" />
          </div>
        </div>
      </div>
      <p class="text-[12px] pl-meta-c mt-4">Used on the final branding slide and the accent rule on each photo.</p>
    </section>

    <section class="pl-panel p-7 mb-6">
      <p class="pl-label mb-5">Contact — shown on the last slide</p>
      <div class="grid sm:grid-cols-3 gap-5">
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Phone</label>
          <input v-model="form.contact.phone" class="pl-input" />
        </div>
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Website</label>
          <input v-model="form.contact.website" class="pl-input" />
        </div>
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Handle</label>
          <input v-model="form.contact.handle" class="pl-input" placeholder="@yourbusiness" />
        </div>
      </div>
    </section>

    <!-- Slide design — with a live preview, because "Editorial" means nothing
         as a word and everything as a picture. -->
    <section class="pl-panel p-7 mb-6">
      <p class="pl-label mb-2">Slide design</p>
      <p class="text-[13px] pl-body-c mb-6 max-w-[54ch] leading-relaxed">
        Pick a look once. Every post uses it, and the preview updates as you change things.
      </p>

      <div class="grid lg:grid-cols-[1fr_240px] gap-7">
        <div>
          <label class="block text-[13px] pl-body-c mb-2.5">Layout</label>
          <div class="grid sm:grid-cols-2 gap-2 mb-6">
            <button
              v-for="t in TEMPLATES" :key="t.value"
              class="text-left px-3.5 py-2.5 rounded-[9px] border transition-colors"
              :style="form.template === t.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="form.template = t.value"
            >
              <span class="block text-[13.5px] font-semibold">{{ t.label }}</span>
              <span class="block text-[11.5px] pl-meta-c mt-0.5">{{ t.hint }}</span>
            </button>
          </div>

          <label class="block text-[13px] pl-body-c mb-2.5">Type</label>
          <div class="grid sm:grid-cols-2 gap-2 mb-6">
            <button
              v-for="f in FONTS" :key="f.value"
              class="text-left px-3.5 py-2.5 rounded-[9px] border transition-colors"
              :style="form.fontPair === f.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="form.fontPair = f.value"
            >
              <span class="block text-[13.5px] font-semibold">{{ f.label }}</span>
              <span class="block text-[11.5px] pl-meta-c mt-0.5">{{ f.hint }}</span>
            </button>
          </div>

          <label class="block text-[13px] pl-body-c mb-2.5">Shape</label>
          <div class="flex gap-2 mb-6">
            <button
              v-for="r in RATIOS" :key="r.value"
              class="flex-1 text-left px-3.5 py-2.5 rounded-[9px] border transition-colors"
              :style="form.ratio === r.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="form.ratio = r.value"
            >
              <span class="block text-[13.5px] font-semibold">{{ r.label }}</span>
              <span class="block text-[11.5px] pl-meta-c mt-0.5">{{ r.hint }}</span>
            </button>
          </div>

          <div class="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label class="block text-[13px] pl-body-c mb-2.5">Text position</label>
              <select v-model="form.textPosition" class="pl-input">
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="centre">Centre</option>
              </select>
            </div>
            <div>
              <label class="block text-[13px] pl-body-c mb-2.5">
                Shade behind text — {{ form.scrimStrength }}%
              </label>
              <input v-model.number="form.scrimStrength" type="range" min="0" max="100" class="w-full pl-check" />
              <p class="text-[11.5px] pl-meta-c mt-1">Raise it if your photos are bright.</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-6">
            <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
              <input v-model="form.watermark" type="checkbox" class="pl-check" />
              Business name on every slide
            </label>
            <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
              <input v-model="form.showAccentRule" type="checkbox" class="pl-check" />
              Accent rule above text
            </label>
          </div>
        </div>

        <div>
          <p class="pl-label mb-3">Preview</p>
          <ClientOnly>
            <appSlideCanvas
              :brand="previewBrand"
              overlay-line="Three weeks, start to finish"
              photo-url=""
              :width="480"
            />
          </ClientOnly>
          <p class="text-[11.5px] pl-meta-c mt-3 leading-relaxed">
            Your photos will fill the background.
          </p>
        </div>
      </div>
    </section>


    <!-- The end card. It's the only slide with a job beyond looking good:
         telling someone what to do next. -->
    <section class="pl-panel p-7 mb-6">
      <p class="pl-label mb-2">Your end card</p>
      <p class="text-[13px] pl-body-c mb-6 max-w-[54ch] leading-relaxed">
        The last slide in every carousel. Give people something to do — a slide
        that just shows your name is a wasted slide.
      </p>

      <div class="grid lg:grid-cols-[1fr_240px] gap-7">
        <div>
          <appLogoUpload
            class="mb-7"
            label="Logo"
            :current-url="logoUrl"
            hint="PNG with a transparent background works best. We keep transparency — no white box."
            @uploaded="onLogo"
          />

          <label class="block text-[13px] pl-body-c mb-2.5">Layout</label>
          <div class="grid sm:grid-cols-2 gap-2 mb-6">
            <button
              v-for="l in END_LAYOUTS" :key="l.value"
              class="text-left px-3.5 py-2.5 rounded-[9px] border transition-colors"
              :style="form.endCard.layout === l.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="form.endCard.layout = l.value"
            >
              <span class="block text-[13.5px] font-semibold">{{ l.label }}</span>
              <span class="block text-[11.5px] pl-meta-c mt-0.5">{{ l.hint }}</span>
            </button>
          </div>

          <label class="block text-[13px] pl-body-c mb-2">What should people do next?</label>
          <input
            v-model="form.endCard.cta" class="pl-input mb-2.5"
            placeholder="Call for a free estimate"
            maxlength="42"
          />
          <div class="flex flex-wrap gap-1.5 mb-6">
            <button
              v-for="idea in ctaIdeas" :key="idea"
              class="text-[11.5px] px-2.5 py-1 rounded-full border transition-colors"
              style="border-color: var(--hair); color: var(--ink-2)"
              @click="form.endCard.cta = idea"
            >
              {{ idea }}
            </button>
          </div>

          <div class="grid sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label class="block text-[13px] pl-body-c mb-2">Headline</label>
              <input
                v-model="form.endCard.headline" class="pl-input"
                :placeholder="form.businessName || 'Your business name'"
                maxlength="60"
              />
            </div>
            <div>
              <label class="block text-[13px] pl-body-c mb-2">Under it</label>
              <input
                v-model="form.endCard.subline" class="pl-input"
                :placeholder="form.tagline || 'Optional'"
                maxlength="80"
              />
            </div>
          </div>
          <p class="text-[11.5px] pl-meta-c -mt-3 mb-6">
            Leave blank to use your business name and tagline.
          </p>

          <label class="block text-[13px] pl-body-c mb-2.5">Background</label>
          <div class="flex gap-2 mb-6">
            <button
              v-for="bgOpt in END_BACKGROUNDS" :key="bgOpt.value"
              class="flex-1 px-3.5 py-2.5 rounded-[9px] border text-[13px] font-semibold transition-colors"
              :style="form.endCard.background === bgOpt.value
                ? { borderColor: 'var(--ink)' }
                : { borderColor: 'var(--hair)' }"
              @click="form.endCard.background = bgOpt.value"
            >
              {{ bgOpt.label }}
            </button>
          </div>

          <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer mb-4">
            <input v-model="form.endCard.usePhoto" type="checkbox" class="pl-check" />
            Use the last photo as a darkened backdrop
          </label>

          <div class="flex items-center gap-5 mb-5">
            <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer shrink-0">
              <input v-model="form.endCard.showLogo" type="checkbox" class="pl-check" />
              Show logo
            </label>
            <select
              v-if="form.endCard.showLogo"
              v-model="form.endCard.logoSize"
              class="pl-input max-w-[140px] py-2 text-[13px]"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <p class="text-[13px] pl-body-c mb-2.5">Show on the card</p>
          <div class="flex flex-wrap gap-5">
            <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
              <input v-model="form.endCard.showPhone" type="checkbox" class="pl-check" />
              Phone
            </label>
            <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
              <input v-model="form.endCard.showWebsite" type="checkbox" class="pl-check" />
              Website
            </label>
            <label class="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
              <input v-model="form.endCard.showHandle" type="checkbox" class="pl-check" />
              Social handle
            </label>
          </div>
        </div>

        <div>
          <p class="pl-label mb-3">End card preview</p>
          <ClientOnly>
            <appSlideCanvas :brand="previewBrand" :is-brand-slide="true" :width="480" />
          </ClientOnly>
          <p class="text-[11.5px] pl-meta-c mt-3 leading-relaxed">
            This is the last slide of every carousel.
          </p>
        </div>
      </div>
    </section>

    <section class="pl-panel p-7 mb-8">
      <p class="pl-label mb-2">Your voice</p>
      <p class="text-[13px] pl-body-c mb-6 max-w-[54ch] leading-relaxed">
        This is what stops your captions sounding like everyone else's. The
        writing samples matter more than anything else here.
      </p>
      <div class="space-y-5">
        <div>
          <label class="block text-[12px] pl-body-c mb-2">How you come across</label>
          <select v-model="form.voice.tone" class="pl-input">
            <option value="warm">Warm and friendly</option>
            <option value="straightforward">Straightforward, no fluff</option>
            <option value="proud">Proud of the craft</option>
            <option value="playful">Playful</option>
            <option value="professional">Polished and professional</option>
          </select>
        </div>
        <div>
          <label class="block text-[12px] pl-body-c mb-2">What you want to be known for</label>
          <input v-model="form.voice.focus" class="pl-input" placeholder="Doing it right the first time" />
        </div>
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Words to avoid</label>
          <input v-model="form.voice.avoid" class="pl-input" placeholder="luxury, dream home, blessed" />
        </div>
        <div>
          <label class="block text-[12px] pl-body-c mb-2">Paste a couple of posts you've actually written</label>
          <textarea v-model="form.voice.samples" rows="5" class="pl-input resize-none" />
        </div>
      </div>
    </section>

    <button class="pl-btn" :disabled="saving" @click="save">
      {{ saving ? 'Saving…' : 'Save brand' }}
    </button>
  </div>
</template>
