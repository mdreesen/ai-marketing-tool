<script setup lang="ts">
const props = defineProps({
    text: {
        type: String,
        required: true,
        default: 'Header'
    },
    subText: {
        type: String,
    },
    css: {
        type: String,
        default: 'mb-6'
    }
})
</script>

<template>
    <h2 :class="`text-lg font-bold tracking-tighter ${css}`" v-html="text"></h2>
    <span v-if="subText" class="font-bold tracking-tighter" v-html="subText" />
</template>