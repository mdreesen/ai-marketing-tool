<script setup lang="ts">
const props = defineProps({
    label: {
        type: String,
        default: ''
    },
    subLabel: {
        type: String,
    }
});
</script>

<template>
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
            <baseHeaderAuth :text="label" :subText="subLabel" />
        </div>
    </header>
</template>