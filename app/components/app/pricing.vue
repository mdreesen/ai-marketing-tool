<script setup lang="ts">
const props = defineProps({
  stripe: {
    type: Boolean,
    default: false
  }
});

const { data: user } = useNuxtData<any>('user');

const tiers = [
  {
    name: 'Shadow',
    subtitle: 'Solo agent',
    price: '29',
    description: 'Everything you need to stop losing leads between the open house and the follow-up.',
    features: [
      'Unlimited leads and QR sign-ins',
      'Captures leads with no cell signal',
      'Tells you who to call each morning',
      'Instant alert the moment a lead comes in',
      'All three forms — open house, listing, quick entry',
      '1 automated follow-up campaign',
      '25 AI-written messages a month'
    ],
    cta: 'Start free trial',
    stripe: `https://buy.stripe.com/8x2aEZe6D6j40B3cCn3wQ02?client_reference_id=${user?.value?._id}`,
    highlighted: true
  },
  {
    name: 'Phantom',
    subtitle: 'High volume',
    price: '59',
    description: 'For agents running several listings at once who need the follow-up to happen without them.',
    // `upgrade: true` marks what you only get by moving up — rendered in the
    // accent colour so the difference is obvious at a glance.
    features: [
      { text: 'Everything in Shadow' },
      { text: 'Unlimited follow-up campaigns', upgrade: true },
      { text: 'Unlimited AI-written messages', upgrade: true },
      { text: 'A separate QR code for every listing', upgrade: true },
      { text: 'Export your whole database anytime', upgrade: true },
      { text: 'Same-day help from the developer', upgrade: true }
    ],
    cta: 'Start free trial',
    stripe: `https://buy.stripe.com/aFaeVffaHcHs1F759V3wQ03?client_reference_id=${user?.value?._id}`,
    highlighted: false
  },
];

// Features are either plain strings or { text, upgrade } — normalise for render.
const asFeature = (f: any) => (typeof f === 'string' ? { text: f, upgrade: false } : f);
</script>

<template>
  <section id="pricing">
    <div class="max-w-4xl mx-auto text-center mb-20">
      <h2 class="gf-display text-4xl sm:text-5xl mb-4">
        Choose your plan
      </h2>
      <p class="text-[#8A847C] text-base leading-relaxed max-w-[42ch] mx-auto">
        One saved deal pays for the year. Free for 30 days — no card to start.
      </p>
    </div>

    <div class="max-w-4xl mx-auto flex flex-wrap gap-8 items-stretch justify-center">
      <div
        v-for="tier in tiers"
        :key="tier.name"
        :class="[
          'relative p-8 transition-all duration-500 border max-w-sm w-full flex flex-col',
          tier.highlighted
            ? 'bg-[#F7F4EF] border-[#B5563A] lg:scale-105 z-10'
            : 'bg-[#EFEAE0] border-[#DDD6C9] hover:border-[#A9A39A]'
        ]"
      >
        <div
          v-if="tier.highlighted"
          class="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#B5563A] text-[#F7F4EF] text-[10px] font-semibold uppercase tracking-[0.14em] px-4 py-1 rounded-full"
        >
          Most Popular
        </div>

        <div class="mb-8">
          <h3 class="font-display text-xl font-bold mb-1">{{ tier.name }}</h3>
          <span class="block text-[10.5px] uppercase tracking-[0.14em] text-[#A9A39A] mb-3">
            {{ tier.subtitle }}
          </span>

          <div class="flex items-baseline gap-1">
            <span class="font-display text-4xl font-semibold tracking-tight">$</span>
            <span class="font-display text-6xl font-semibold tracking-tight leading-none tabular-nums">
              {{ tier.price }}
            </span>
            <span class="text-[#8A847C] text-sm">/mo</span>
          </div>

          <p class="mt-4 text-[#8A847C] text-sm leading-relaxed">{{ tier.description }}</p>
        </div>

        <ul class="space-y-4 mb-10 flex-1">
          <li
            v-for="feature in tier.features"
            :key="asFeature(feature).text"
            class="flex items-start gap-3 text-[14px]"
            :class="asFeature(feature).upgrade ? 'text-[#1F1B16] font-medium' : 'text-[#1F1B16]'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
              class="mt-1 shrink-0"
              :stroke="asFeature(feature).upgrade ? '#B5563A' : '#A9A39A'"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {{ asFeature(feature).text }}
          </li>
        </ul>

        <NuxtLink v-if="stripe" :to="tier.stripe" class="mt-auto">
          <button
            :class="[
              'w-full py-4 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors active:scale-[0.98]',
              tier.highlighted
                ? 'bg-[#B5563A] text-[#F7F4EF] hover:bg-[#9d4830]'
                : 'bg-transparent text-[#1F1B16] hover:bg-[#DDD6C9] border border-[#A9A39A]'
            ]"
          >
            {{ tier.cta }}
          </button>
        </NuxtLink>

        <NuxtLink v-else to="/signup" class="mt-auto">
          <button
            :class="[
              'w-full py-4 text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors active:scale-[0.98]',
              tier.highlighted
                ? 'bg-[#B5563A] text-[#F7F4EF] hover:bg-[#9d4830]'
                : 'bg-transparent text-[#1F1B16] hover:bg-[#DDD6C9] border border-[#A9A39A]'
            ]"
          >
            {{ tier.cta }}
          </button>
        </NuxtLink>
      </div>
    </div>

    <p class="text-center text-[12.5px] text-[#A9A39A] mt-10 max-w-[46ch] mx-auto leading-relaxed">
      Cancel anytime. Built and supported in Kalispell, Montana.
    </p>
  </section>
</template>
