<script setup lang="ts">
const props = defineProps({
    text: {
        type: String,
        required: true,
        default: 'Save'
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    isLoadingText: {
        type: String,
        default: 'Please wait...'
    }
})
</script>

<template>
    <button type="submit" :disabled="isLoading"
    :class="`${isLoading ? 'bg-linear-to-r from-gray-500 to-gray-600' : 'bg-[#B5563A] hover:bg-[#8f4229] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#B5563A] focus:ring-offset-2 focus:ring-offset-[#F7F4EF]'} w-full py-3 text-lg font-semibold text-[#F7F4EF] shadow-none transition-all duration-300 ease-in-out`">
    {{ isLoading ? props.isLoadingText : text }}
    </button>
</template>