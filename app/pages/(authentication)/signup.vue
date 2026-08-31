<script setup lang="ts">
const toast = useToast();

const credentials = reactive({
  company: '',
  category: '',
  email: '',
  password: '',
  confirm_password: '',
  privacy_policy: false
});

const isLoading = ref(false);
let errorMessage = ref('');
const { fetch: refreshSession } = useUserSession();

async function handler() {
  try {
    isLoading.value = true;
    await $fetch('/api/authentication/signup', { method: 'POST', body: credentials });
    await $fetch('/api/authentication/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } });
    await refreshSession();
    await navigateTo('/subscribe');

  } catch (error) {
    toast.error("Sign up failed", 'Try again');
    console.log(error)
    errorMessage.value = error.statusMessage;
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex items-center justify-center py-20 relative overflow-hidden">

    <main class="w-full max-w-120 z-10">
      <div class="backdrop-blur-2xl bg-[#F7F4EF] border border-[#DDD6C9] p-10 shadow-2xl">

        <header class="mb-10">
          <div class="flex items-center gap-3 mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-[#1F1B16]">Initialize Account</h1>
          </div>
          <p class="text-[#8A847C] text-sm italic-none">Join the network of high-velocity intelligence.</p>
        </header>

        <div class="space-y-6">


          <form @submit.prevent="handler" class="space-y-6">
            <div v-motion="{ ...inputVarient() }" class="space-y-4">
              <div>
                <baseLabel text="Company Name" />
                <input v-model="credentials.company" type="text" placeholder="e.g. Company name" required
                  class="w-full bg-white/60 border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis" />
              </div>

              <div>
                <span class="text-[10px] text-[#8A847C] font-bold uppercase tracking-widest ml-1 mb-2 block">Primary
                  Category</span>
                <select v-model="credentials.category"
                  class="w-full bg-white/60 text-[#8A847C] border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis">
                  <option value="realtor">Realtor</option>
                  <!-- <option value="construction">Construction</option> -->
                </select>
              </div>
            </div>

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

            <div v-motion="{ ...inputVarient() }">
              <baseLabel text="Confirm password" />
              <input id="confirm_password" type="password" v-model="credentials.confirm_password" placeholder="Password"
                required
                class="w-full bg-white/60 border border-[#DDD6C9] px-5 py-3 text-sm focus:outline-none focus:border-[#B5563A] transition-colors placeholder:text-[#A9A39A] text-ellipsis" />
            </div>

            <div v-motion="{ ...inputVarient() }" class="flex items-center space-x-2">
              <label class="flex items-start gap-3 cursor-pointer group mt-4">
                <div class="relative flex items-center bg-black/9">
                  <input type="checkbox" v-model="credentials.privacy_policy" class="sr-only peer" required />
                  <div
                    class="w-5 h-5 border border-white/20 rounded-md peer-checked:bg-[#30cf43] peer-checked:border-[#30cf43] transition-all">
                  </div>
                  <svg
                    class="absolute w-3 h-3 text-[#1F1B16] scale-0 peer-checked:scale-100 transition-transform left-1"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-xs text-[#8A847C] group-hover:text-[#1F1B16] transition-colors leading-snug">
                  I accept the data processing protocols and AI analysis terms.
                </span>
              </label>
            </div>

            <baseButtonSubmit text="Save" :isLoading="isLoading" />

          </form>

          <p class="text-center text-xs text-[#8A847C]">
            Already have an account? <NuxtLink to="/login" class="text-[#B5563A] hover:underline">Access Login
            </NuxtLink>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Smooth manifestation animation */
main {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom Select styling for dark mode */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}
</style>