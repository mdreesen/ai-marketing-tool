<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Trash2, AlertTriangle, X, ShieldAlert, Skull } from 'lucide-vue-next'

// --- Props & Emits ---
const emit = defineEmits(['confirm-delete'])

// --- State ---
const isOpen = ref(false)
const isHolding = ref(false)
const progress = ref(0)
const holdInterval = ref<NodeJS.Timeout | null>(null)
const isDeleted = ref(false) // Visual state after completion
const { fetch: refreshSession } = useUserSession();

const isLoading = ref(false);
let errorMessage = ref('');

// --- Actions ---
const openModal = () => isOpen.value = true
const closeModal = () => {
  if (isDeleted.value) return // Lock if already done
  isOpen.value = false
  resetHold()
}

// --- The "Hold to Disintegrate" Logic ---
const startHold = () => {
  if (isDeleted.value) return
  isHolding.value = true

  if (holdInterval.value) clearInterval(holdInterval.value)

  holdInterval.value = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 2 // Speed of deletion (approx 1.5s - 2s)
    } else {
      completeDelete()
    }
  }, 30)
}

const stopHold = () => {
  if (isDeleted.value) return
  isHolding.value = false
  if (holdInterval.value) clearInterval(holdInterval.value)

  // Rapid decay if released early
  const decay = setInterval(() => {
    if (progress.value > 0 && !isHolding.value) {
      progress.value -= 10
    } else {
      clearInterval(decay)
    }
  }, 20)
}

const resetHold = () => {
  progress.value = 0
  isHolding.value = false
  if (holdInterval.value) clearInterval(holdInterval.value)
}

const completeDelete = () => {
  isDeleted.value = true
  if (holdInterval.value) clearInterval(holdInterval.value)

  $fetch('/api/authentication/delete', {
    method: 'DELETE',
  })
    .then(async () => {
      await refreshSession();
      await navigateTo('/signup');

      isLoading.value = false;
    })
    .catch(async (error) => {
      console.log(error);
      errorMessage.value = error.statusMessage;
      isLoading.value = false;
    });

  // Wait a moment for the visual effect, then emit
  setTimeout(() => {
    emit('confirm-delete');
    navigateTo('/signup');
    // In a real app, you might redirect here
  }, 1000)
}

onUnmounted(() => {
  if (holdInterval.value) clearInterval(holdInterval.value)
})
</script>

<template>
  <div class="font-sans">

    <button @click="openModal"
      class="group relative px-6 py-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all w-full flex items-center justify-between overflow-hidden">
      <div class="flex items-center gap-3 relative z-10">
        <div class="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:text-red-400 transition-colors">
          <Trash2 class="w-5 h-5" />
        </div>
        <div class="text-left">
          <span class="block text-red-500 font-bold text-sm">Delete Profile</span>
          <span class="block text-red-500/50 text-[10px] uppercase font-bold tracking-wider">Irreversible</span>
        </div>
      </div>

      <AlertTriangle class="w-5 h-5 text-red-500/20 group-hover:text-red-500 transition-colors relative z-10" />
    </button>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div @click="closeModal" class="absolute inset-0 bg-[#1F1B16]/40 backdrop-blur-md"></div>

          <div
            class="relative w-full bg-[#F7F4EF] border border-[#DDD6C9] rounded-4xl p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button @click="closeModal"
              class="absolute top-4 right-4 p-2 text-[#A9A39A] hover:text-[#1F1B16] transition-colors z-20">
              <X class="w-6 h-6" />
            </button>

            <div class="relative z-10 flex flex-col items-center text-center">

              <div
                class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-1 ring-red-500/30">
                <ShieldAlert class="w-8 h-8 text-red-500" />
              </div>

              <h2 class="text-2xl font-bold text-[#1F1B16] mb-2">Final Warning</h2>
              <p class="text-[#8A847C] text-sm leading-relaxed mb-8">
                This will wipe your history, metrics, and progress. There is no going back.
              </p>

              <div class="w-full relative">
                <div>
                  <button @mousedown="startHold" @mouseup="stopHold" @mouseleave="stopHold"
                    @touchstart.prevent="startHold" @touchend.prevent="stopHold"
                    class="relative w-full h-16 bg-zinc-800 overflow-hidden flex items-center justify-center border border-[#DDD6C9] group select-none touch-none">
                    <div class="absolute bottom-0 left-0 h-full bg-red-600 transition-all duration-75 ease-linear"
                      :style="{ width: `${progress}%` }"></div>

                    <div class="relative z-10 flex items-center gap-2 pointer-events-none">
                      <component :is="isDeleted ? '' : Trash2" class="w-5 h-5 transition-colors"
                        :class="progress > 50 ? 'text-[#1F1B16]' : 'text-red-500'" />
                      <span class="font-bold uppercase tracking-widest text-sm transition-colors"
                        :class="progress > 50 ? 'text-[#1F1B16]' : 'text-red-500'">
                        {{ isDeleted ? 'Account Deleted' : (isHolding ? 'Hold to Delete...' : 'Press & Hold') }}
                      </span>
                    </div>
                  </button>
                </div>

                <p v-if="!isDeleted"
                  class="mt-4 text-[10px] text-[#A9A39A] font-bold uppercase tracking-widest opacity-60">
                  Release to cancel
                </p>
              </div>

            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* Fade Transition for Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>