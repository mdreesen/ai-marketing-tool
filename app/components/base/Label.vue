<script setup lang="ts">
const props = defineProps({
    text: {
        type: String,
        required: true
    }
})
</script>

<template>
    <label for="text" class="block text-sm font-medium mb-1 text-[#8A847C]">{{ props.text }}</label>
</template>