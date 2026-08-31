<script setup lang="ts">
import { ref } from 'vue';
import { useMotion } from '@vueuse/motion';
import { formVarient, containerVarient, inputVarient } from '~/utils/varients';

useHead({
  title: 'GhostForm | Forgot Password',
  meta: [
    { name: 'description', content: 'GhostForm Forgot Password.' },
  ],
});

const formRef = ref();
const message = ref('');
const isLoading = ref(false);
let errorMessage = ref('');

const { fetch: refreshSession } = useUserSession();
const toast = useToast();

const credentials = reactive({
  email: '',
  password: '',
});

async function login() {
  isLoading.value = true;
  $fetch('/api/authentication/login', {
    method: 'POST',
    body: credentials
  })
    .then(async () => {
      await refreshSession();

      await navigateTo('/dashboard');

      isLoading.value = false;
    })
    .catch(async (error) => {
      toast.error("Forgot password failed", 'Try again');
      console.log(error);
      errorMessage.value = error.statusMessage;
      isLoading.value = false;
    });
}

useMotion(formRef, { ...formVarient() });

</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gray-950 p-4 overflow-hidden">
    <!-- Background Gradient -->
    <div class="absolute inset-0 z-0 bg-linear-to-br from-gray-950 via-gray-800 to-purple-950 opacity-70"></div>

    <!-- Hero Text -->
    <section class="flex flex-col items-center gap-8">
      <div class="text-center" v-motion="{ ...containerVarient() }">

        <h1 class="flex flex-col text-4xl sm:text-6xl font-extrabold text-[#1F1B16] leading-tight">
          <span>Welcome to</span>
          <span class="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">
            ASCΞND
          </span>
        </h1>
        <p class="mt-2 text-lg sm:text-xl text-gray-400">Log in to unlock your journey.</p>
      </div>

      <!-- Login Form Container -->
      <div ref="formRef"
        class="relative z-20 w-full border border-gray-700 bg-gray-800/50 p-8 shadow-2xl backdrop-blur-md space-y-6 transform transition-all duration-300">

        <!-- Message Area -->
        <div v-if="errorMessage" class="text-center py-2 px-4 rounded-lg" :class="'bg-red-600/30 text-red-400'"
          v-motion="{ ...inputVarient() }">
          {{ errorMessage }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="login" class="space-y-6">
          <div v-motion="{ ...inputVarient() }">
            <baseLabel text="Email" />
            <input id="email" type="email" v-model="credentials.email" placeholder="Email" required
              class="w-full border border-gray-600 bg-gray-700/50 py-3 px-4 text-lg text-[#F7F4EF] transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#B5563A]" />
          </div>

          <div v-motion="{ ...inputVarient() }">
            <baseLabel text="Password" />
            <input id="password" type="password" v-model="credentials.password" placeholder="Password" required
              class="w-full border border-gray-600 bg-gray-700/50 py-3 px-4 text-lg text-[#F7F4EF] transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#B5563A]" />
          </div>

          <div v-motion="{ ...inputVarient() }">
            <button type="submit" :disabled="isLoading"
              :class="`${isLoading ? 'bg-linear-to-r from-gray-500 to-gray-600' : 'bg-[#B5563A] hover:bg-[#8f4229] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#B5563A] focus:ring-offset-2 focus:ring-offset-[#F7F4EF]'} w-full py-3 text-lg font-semibold text-[#F7F4EF] transition-all duration-300 ease-in-out`">
              {{ isLoading ? 'Logging In...' : 'Log In' }}
            </button>
          </div>
        </form>

        <div v-motion="{ ...inputVarient() }" class="relative flex items-center justify-center py-4">
          <div class="absolute w-full border-t border-gray-700"></div>
          <span class="relative z-10 bg-gray-800/80 backdrop-blur-md px-4 text-gray-400 text-sm">OR</span>
        </div>

        <!-- Signup Link -->
        <div class="text-center" v-motion="{ ...inputVarient() }">
          <p class="text-gray-400 text-sm">
            Don't have an account?
            <NuxtLink to="/signup" class="text-blue-400 hover:underline transition-colors">Sign up</NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>