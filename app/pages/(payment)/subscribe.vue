<script setup lang="ts">
definePageMeta({
  layout: 'payment',
});

// Load just the user (needed for the client_reference_id on the payment links).
await useFetch('/api/user', { key: 'user', lazy: true });

useHead({
  title: 'GhostForm | Subscribe',
  meta: [
    { name: 'Subscribe', content: 'GhostForm Subscribe' },
  ],
});

</script>

<template>
    <div>
        <appPricing stripe />
    </div>
</template>