<script setup lang="ts">
import { codeToHtml } from 'shiki'

const props = defineProps<{
  code: string
  lang: string
}>()

const highlightedCode = ref('')
const copied = ref(false)

// Highlight code with Shiki v3
onMounted(async () => {
  try {
    const html = await codeToHtml(props.code, {
      lang: props.lang || 'text',
      theme: 'github-dark'
    })
    highlightedCode.value = html
  } catch (err) {
    // Fallback to plain text with basic styling
    highlightedCode.value = `<pre style="background: #0d1117; color: #c9d1d9; padding: 0; margin: 0;"><code>${escapeHtml(props.code)}</code></pre>`
  }
})

function escapeHtml(text: string) {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

async function copyCode() {
  await navigator.clipboard.writeText(props.code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="opacity-100 translate-y-2 animate-[slideIn_0.3s_ease-out_forwards]">
    <div class="relative bg-gradient-to-br from-[#0d1117] to-[#000000] border-2 border-[#30363d] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 hover:border-green-500/30 transition-all duration-300 group">

      <!-- Glowing Top Border Effect -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <!-- Header with Language Badge -->
      <div class="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#161b22] to-[#0d1117] border-b-2 border-[#30363d]">
        <div class="flex items-center gap-3">
          <!-- Terminal Icon -->
          <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </div>

          <!-- Language Label -->
          <div class="flex flex-col">
            <span class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Language</span>
            <span class="text-sm font-bold text-green-400 capitalize font-mono">
              {{ lang === 'js' ? 'JavaScript' : lang === 'ts' ? 'TypeScript' : lang === 'py' ? 'Python' : lang }}
            </span>
          </div>
        </div>

        <!-- Copy Button -->
        <button
          @click="copyCode"
          class="flex items-center gap-2.5 px-4 py-2 text-sm bg-[#21262d] border-2 border-[#30363d] rounded-lg text-gray-300 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 hover:border-green-500 hover:text-white hover:scale-105 active:scale-95 shadow-md"
        >
          <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="font-semibold">{{ copied ? 'Copied!' : 'Copy Code' }}</span>
        </button>
      </div>

      <!-- Code content with line numbers effect -->
      <div class="relative flex">
        <!-- Line numbers decoration -->
        <div class="flex-shrink-0 w-14 bg-[#0a0d12] border-r border-[#30363d] py-5 px-2 text-center">
          <div v-for="n in Math.min(50, (code.match(/\n/g) || []).length + 1)" :key="n" class="text-[11px] text-gray-600 font-mono leading-6 select-none">
            {{ n }}
          </div>
        </div>

        <!-- Code -->
        <div class="flex-1 px-6 py-5 overflow-x-auto text-[0.95rem] leading-6 code-scrollbar" v-html="highlightedCode"></div>
      </div>

      <!-- Footer with info -->
      <div class="px-6 py-2 bg-[#0a0d12] border-t border-[#30363d] flex items-center justify-between text-xs text-gray-600">
        <span class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Ready to use
        </span>
        <span>{{ (code.match(/\n/g) || []).length + 1 }} lines</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.code-scrollbar :deep(pre) {
  margin: 0 !important;
  background: transparent !important;
  padding: 0 !important;
  overflow: visible !important;
}

.code-scrollbar :deep(code) {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace !important;
  background: transparent !important;
  display: block !important;
  white-space: pre !important;
  word-wrap: normal !important;
}

.code-scrollbar :deep(.line) {
  display: block;
  min-height: 1.5rem;
}

/* Custom scrollbar */
.code-scrollbar::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.code-scrollbar::-webkit-scrollbar-track {
  background: #0d1117;
}

.code-scrollbar::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 4px;
}

.code-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}
</style>
