<script setup lang="ts">
/**
 * Step indicator.
 *
 * Its real job isn't decoration — it answers "how much more of this is there?"
 * before the user has to wonder. A business owner who can see there are four
 * steps and they're on two will finish; one who can't see the end often won't.
 */
const props = defineProps<{
  steps: { key: string; label: string }[]
  current: number
  /** Everything finished. Every step shows done rather than one sitting "current". */
  complete?: boolean
}>()

/**
 * A step is DONE if we're past it, or if the whole flow is complete.
 * A step is CURRENT only while there's still something to do — otherwise the
 * final step would sit highlighted as "you are here" after the user has
 * already finished, which is what made the old stepper feel off by one.
 */
const stateOf = (i: number) => {
  if (props.complete) return 'is-done'
  if (i < props.current) return 'is-done'
  if (i === props.current) return 'is-current'
  return ''
}
</script>

<template>
  <ol class="pl-steps">
    <li
      v-for="(s, i) in steps" :key="s.key"
      class="pl-step"
      :class="stateOf(i)"
    >
      <span class="pl-step-dot">
        <svg v-if="complete || i < current" width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span class="pl-step-label">{{ s.label }}</span>
      <span v-if="i < steps.length - 1" class="pl-step-line" />
    </li>
  </ol>
</template>
