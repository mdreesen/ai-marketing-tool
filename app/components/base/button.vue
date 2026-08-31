<script setup lang="ts">
const props = defineProps({
    text: {
        type: String,
        required: true,
        default: 'Button'
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    path: {
        type: String,
        default: "/"
    }
})
</script>

<template>
    <button
    class="inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 gap-1.5 ring ring-inset ring-accented hover:bg-accented/75 active:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted bg-[#B5563A] text-[#F7F4EF] px-6 py-3 text-xs font-bold hover:shadow-[0_0_20px_rgba(48,207,67,0.4)] transition-all">
    {{ text }}
    </button>
</template>