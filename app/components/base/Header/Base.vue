<script setup lang="ts">
const props = defineProps({
    text: {
        type: String,
        required: true,
        default: 'Header'
    },
})
</script>

<template>
    <h2 class="text-4xl font-semibold mb-12 text-center">{{ text }}</h2>
</template>