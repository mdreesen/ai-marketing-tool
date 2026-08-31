<script setup lang="ts">
definePageMeta({ layout: 'authenticated' })
useHead({ title: 'Postline — Account' })

/**
 * ACCOUNT — login and billing only.
 *
 * Voice used to live here as well as on the Brand page. Two forms wrote to two
 * different places (User.voice vs Brand.voice) and the caption writer only ever
 * read the Brand one — so anything typed here silently did nothing. Worse, this
 * page POSTed to /api/user/voice, which doesn't exist.
 *
 * Voice now lives in exactly one place: Brand. It belongs next to the colours
 * and logo anyway — it's brand voice, not account settings.
 */
const toast = useToast()
const { data: user, refresh } = await useFetch<any>('/api/user', { key: 'user', lazy: true })

const saving = ref(false)
const form = reactive({ name: '', email: '', businessName: '', industry: 'other' })

watch(user, (u) => {
  if (!u) return
  form.name = u.name ?? ''
  form.email = u.email ?? ''
  form.businessName = u.businessName ?? ''
  form.industry = u.industry ?? 'other'
}, { immediate: true })

const INDUSTRIES = [
  { value: 'realtor', label: 'Real estate' },
  { value: 'trades',  label: 'Trades &amp; contracting' },
  { value: 'church',  label: 'Church or nonprofit' },
  { value: 'other',   label: 'Something else' }
]

async function save() {
  saving.value = true
  try {
    await $fetch('/api/user', { method: 'PUT', body: { ...form } })
    await refresh()
    toast.add({ title: 'Account updated.', color: 'success' })
  } catch (err: any) {
    toast.add({ title: err?.data?.message || 'Could not save.', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-10">
    <p class="pl-label mb-3">Account</p>
    <h1 class="pl-display text-[28px] mb-2">Your details</h1>
    <p class="text-[14px] pl-body-c mb-9 max-w-[50ch] leading-relaxed">
      Login and billing. How your posts look and sound lives on the
      <NuxtLink to="/dashboard/brand" style="color: var(--ink)">Brand page</NuxtLink>.
    </p>

    <section class="pl-panel p-6 mb-6">
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-[13px] pl-body-c mb-2">Your name</label>
          <input v-model="form.name" class="pl-input" />
        </div>
        <div>
          <label class="block text-[13px] pl-body-c mb-2">Email</label>
          <input v-model="form.email" type="email" class="pl-input" />
        </div>
        <div>
          <label class="block text-[13px] pl-body-c mb-2">Business name</label>
          <input v-model="form.businessName" class="pl-input" />
        </div>
        <div>
          <label class="block text-[13px] pl-body-c mb-2">What you do</label>
          <select v-model="form.industry" class="pl-input">
            <option v-for="i in INDUSTRIES" :key="i.value" :value="i.value" v-text="i.label" />
          </select>
        </div>
      </div>
      <p class="text-[12px] pl-meta-c mt-4">
        What you do shapes the questions we ask and the captions we write.
      </p>
    </section>

    <!-- Pointer to where the creative settings actually are -->
    <NuxtLink
      to="/dashboard/brand"
      class="pl-panel pl-panel-hover p-5 mb-8 flex items-center justify-between gap-4"
    >
      <div>
        <p class="text-[14px] font-semibold mb-0.5">Brand &amp; voice</p>
        <p class="text-[13px] pl-body-c">Colours, logo, and how your captions sound.</p>
      </div>
      <span class="text-[13px] shrink-0" style="color: var(--ink)">Open →</span>
    </NuxtLink>

    <button class="pl-btn" :disabled="saving" @click="save">
      {{ saving ? 'Saving…' : 'Save changes' }}
    </button>

    <div class="mt-14 pt-8" style="border-top: 1px solid var(--hair)">
      <p class="pl-label mb-3">Danger zone</p>
      <baseDeleteProfile />
    </div>
  </div>
</template>
