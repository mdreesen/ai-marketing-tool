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
    },
    css: {
        type: String,
        defaut: ''
    }
})
</script>

<template>
    <nuxt-link :to="path">
        <button
        :class="`flex-1 md:flex-initial inline-flex items-center justify-center px-4 py-2 border border-[#DDD6C9] hover:border-[#A9A39A] hover:bg-[#EFEAE0] text-[#8A847C] hover:text-[#1F1B16] text-[11px] font-semibold uppercase tracking-wider transition-all ${css}`">
        {{ text }}
        </button>
    </nuxt-link>
</template>