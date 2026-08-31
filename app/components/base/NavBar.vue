<script setup lang="ts">
const { data: user } = useNuxtData('user');

const items = [
  { label: 'Posts', to: '/dashboard' },
  { label: 'Brand', to: '/dashboard/brand' },
  { label: 'Profile', to: '/dashboard/profile' },
];

const route = useRoute();
const stuck = ref(false);
const open = ref(false);

// Exact match for the dashboard root, prefix match for the rest, so
// /dashboard/brand does not also light up "Posts".
const isActive = (to: string) =>
  to === '/dashboard' ? route.path === to : route.path.startsWith(to);

const onScroll = () => { stuck.value = window.scrollY > 40; };

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));

// Close the mobile menu whenever we navigate.
watch(() => route.path, () => { open.value = false; });
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-500 backdrop-blur-md"
    :class="stuck ? 'border-[#DDD6C9]' : 'border-transparent'"
  >
    <div class="flex items-center justify-between px-6 sm:px-10 lg:px-12 py-5">
      <NuxtLink to="/dashboard" class="font-display font-bold text-[17px] tracking-tight">
        GhostForm
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-9">
        <NuxtLink
          v-for="link in items"
          :key="link.to"
          :to="link.to"
          :data-tour="`nav-${link.label.toLowerCase()}`"
          class="relative pb-1 text-[9.5px] uppercase tracking-[0.14em] transition-colors duration-200"
          :class="isActive(link.to) ? 'text-[#1F1B16]' : 'text-[#A9A39A] hover:text-[#1F1B16]'"
        >
          {{ link.label }}
          <span
            v-if="isActive(link.to)"
            class="absolute left-0 right-0 -bottom-0.5 h-px bg-[#B5563A]"
          />
        </NuxtLink>
        <img v-if="user?.headshot_url" :src="user?.headshot_url" :alt="user?.name"
          class="w-11 h-11 rounded-full object-cover shrink-0" />
      </nav>

      <!-- Mobile -->
      <div class="flex md:hidden items-center gap-2">
        <button
          class="w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
          :aria-expanded="open"
          aria-label="Menu"
          @click="open = !open"
        >
          <span
            class="block w-5 h-px bg-[#1F1B16] transition-transform duration-300"
            :class="open ? 'translate-y-[3px] rotate-45' : ''"
          />
          <span
            class="block w-5 h-px bg-[#1F1B16] transition-transform duration-300"
            :class="open ? '-translate-y-[3px] -rotate-45' : ''"
          />
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-if="open"
        class="md:hidden border-t border-[#DDD6C9] bg-[#F7F4EF] px-6 py-4 flex flex-col"
      >
        <NuxtLink
          v-for="link in items"
          :key="link.to"
          :to="link.to"
          class="py-3 text-[12px] uppercase tracking-[0.14em] border-b border-[#DDD6C9] last:border-0"
          :class="isActive(link.to) ? 'text-[#B5563A]' : 'text-[#8A847C]'"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </Transition>
  </header>
</template>
