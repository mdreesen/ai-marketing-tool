<script setup>
useSeoMeta({
  title: 'GhostForm | The High-Performance Lead Dashboard for GhostForm',
  ogTitle: 'GhostForm | Capture Leads Like a Ghost in the Machine',
  description: 'GhostForm Dashboard to manage your leads.',
  ogDescription: 'GhostForm Dashboard to manage your leads.',
  ogImage: '/og-image.png', // Create a 1200x630 image of your new logo
  twitterCard: 'summary_large_image',
  twitterTitle: 'GhostForm - GhostForm Dashboard to manage your leads.',
  twitterDescription: 'GhostForm Dashboard to manage your leads.',
  themeColor: '#020203', // Matches your deep black background
})
</script>
<template>
  <div>
    <UApp>
      <NuxtLayout>
        <VitePwaManifest/>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>