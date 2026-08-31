<script setup lang="ts">
const route = useRoute();

useHead({
  meta: [{ property: 'og:title', content: `GhostForm - ${route.meta.title}` }],
});
</script>

<template>
  <main class="bg-[#F7F4EF] text-zinc-100 selection:bg-[#B5563A]/30 font-sans">

    <div>
      <slot />
    </div>
  </main>
</template>