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
})
</script>

<template>
    <h1 class="text-4xl md:text-5xl font-bold tracking-tighter" v-html="text" />
    <span v-if="subText" class="font-bold tracking-tighter" v-html="subText" />
</template>