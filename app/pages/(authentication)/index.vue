<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
import { ref, reactive } from 'vue';
import { useMotion } from '@vueuse/motion';
import { formVarient, containerVarient, inputVarient } from '~/utils/varients';

const formRef = ref();
const isLoading = ref(false);
let errorMessage = ref('');

const { fetch: refreshSession } = useUserSession();
const toast = useToast();

const credentials = reactive({
  email: '',
  password: '',
});

const input = reactive({
  email: "",
  question: ""
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
    })
    .catch(async (error) => {
      toast.error("Log in failed", 'Try again');
      console.log(error);
      errorMessage.value = error.statusMessage;
      isLoading.value = false;
    });
};

async function forgotpassword() {
  isLoading.value = true;
  $fetch(`/api/authentication/forgot`, {
    method: 'POST',
    body: {
      ...input
    }
  })
    .then(async () => {
      await refreshSession();
      isLoading.value = false;
      // toast.success("Email sent", "Check you email and don't forget checking spam folder!");
    })
    .catch(async (error) => {
      console.log(error);
      errorMessage.value = error.statusMessage;
      isLoading.value = false;
    });
};

useMotion(formRef, { ...formVarient() });

</script>

<template>
  <div
    class="flex items-center justify-center py-20 relative overflow-hidden">

    <main class="w-full max-w-110 z-10">
      <div class="backdrop-blur-xl bg-white/60 border border-[#DDD6C9] p-10 shadow-2xl">

        <header class="text-center mb-12">
          <h1 class="text-3xl font-bold tracking-tight text-[#1F1B16] mb-2">GhostForm</h1>
          <p class="text-[#8A847C] text-sm">Intelligence for the Unseen.</p>
        </header>

        <div class="space-y-6">
          <!-- Login Form -->
          <form @submit.prevent="login" class="space-y-6">
            <div v-motion="{ ...inputVarient() }">
              <baseLabel text="Email" />
              <input id="email" type="email" v-model="credentials.email" placeholder="Email" required
              class="w-full bg-white/60 border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis" />
            </div>

            <div v-motion="{ ...inputVarient() }">
              <baseLabel text="Password" />
              <input id="password" type="password" v-model="credentials.password" placeholder="Password" required
              class="w-full bg-white/60 border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis" />
            </div>

            <div v-motion="{ ...inputVarient() }"
              class="flex flex-col items-center justify-center w-full mx-auto">

              <div class="w-full relative flex justify-end">

                <transition name="slide-up" mode="out-in">

                  <UDrawer title="Reset your password" :overlay="false" class="bg-black">
                    <UButton label="Forgot password" color="neutral" variant="subtle" />

                    <template #body>
                      <form @submit.prevent="forgotpassword" class="space-y-6">

                        <div v-motion="{ ...inputVarient() }">
                          <baseLabel text="Email" />
                          <input id="email" type="email" v-model="input.email" placeholder="Email" required
                          class="w-full bg-white/60 border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis" />
                        </div>

                        <div v-motion="{ ...inputVarient() }">
                          <baseLabel text="Question" />
                          <input id="question" type="text" v-model="input.question" placeholder="What is 4 + 3" required
                          class="w-full bg-white/60 border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis" />
                        </div>

                        <div class="flex flex-col gap-8 pb-4">
                          <baseButtonSubmit text="Reset" :isLoading="isLoading" isLoadingText="Submitting..." />
                        </div>
                      </form>
                    </template>
                  </UDrawer>
                </transition>
              </div>
            </div>

            <div v-motion="{ ...inputVarient() }">
              <baseButtonSubmit text="Log in" :isLoading="isLoading" />
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

          <!-- <ClientOnly>
            <GoogleLoginButton :verify-on-server="true" :options="{ theme: 'filled_blue', size: 'large' }"
              @success="onSuccess" @verified="onVerified" @error="onError" />
          </ClientOnly> -->

          <div class="relative flex items-center py-2">
            <div class="grow border-t border-[#DDD6C9]"></div>
            <span class="shrink mx-4 text-[#8A847C] text-[10px] uppercase tracking-widest font-bold">Encrypted
              Session</span>
            <div class="grow border-t border-[#DDD6C9]"></div>
          </div>

          <p class="text-center text-xs text-[#8A847C] leading-relaxed">
            Authorized personnel only. Sessions are logged and analyzed for regional compliance.
          </p>
        </div>

      </div>

      <!-- <footer class="mt-8 flex justify-between items-center px-4">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-[#30cf43] shadow-[0_0_8px_#30cf43]"></div>
          <span class="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest">Ghost-Node Active</span>
        </div>
        <span class="text-[10px] font-mono text-[#A9A39A] italic-none">v3.0.4-LITE</span>
      </footer> -->
    </main>
  </div>
</template>

<style scoped>
/* Glassmorphism focus effects */
main {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>