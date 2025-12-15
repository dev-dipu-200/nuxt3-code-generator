<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

// Reactive state
const prompt = ref('')
const answer = ref('')
const loading = ref(false)
const streamedText = ref('')

// Conversation history
interface ConversationItem {
  question: string
  answer: string
  isStreaming?: boolean
}
const conversation = ref<ConversationItem[]>([])

// Refs for auto-focus
const initialInputRef = ref<HTMLInputElement | null>(null)
const followUpTextareaRef = ref<HTMLTextAreaElement | null>(null)

// Auto-resize textarea
const autoResizeTextarea = () => {
  nextTick(() => {
    if (followUpTextareaRef.value) {
      followUpTextareaRef.value.style.height = 'auto'
      followUpTextareaRef.value.style.height = followUpTextareaRef.value.scrollHeight + 'px'
    }
  })
}

watch(prompt, autoResizeTextarea)

// Auto-focus follow-up input when response finishes
watch(loading, (isLoading) => {
  if (!isLoading && answer.value) {
    nextTick(() => {
      followUpTextareaRef.value?.focus()
    })
  }
})

async function askAI() {
  if (!prompt.value.trim()) return

  const currentQuestion = prompt.value
  prompt.value = '' // Clear input immediately

  loading.value = true

  // Add new conversation item
  const newItem: ConversationItem = {
    question: currentQuestion,
    answer: '',
    isStreaming: true
  }
  conversation.value.push(newItem)
  const itemIndex = conversation.value.length - 1

  try {
    const res = await $fetch<{ answer: string }>('http://localhost:8000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { question: currentQuestion }
    })

    const fullAnswer = res.answer
    let currentIndex = 0
    const streamInterval = setInterval(() => {
      if (currentIndex < fullAnswer.length) {
        if (conversation.value[itemIndex]) {
          conversation.value[itemIndex].answer += fullAnswer[currentIndex]
        }
        currentIndex++
      } else {
        clearInterval(streamInterval)
        if (conversation.value[itemIndex]) {
          conversation.value[itemIndex].isStreaming = false
        }
      }
    }, 10)

  } catch (err) {
    if (conversation.value[itemIndex]) {
      conversation.value[itemIndex].answer = 'Error: Could not connect to backend (localhost:8000)'
      conversation.value[itemIndex].isStreaming = false
    }
  } finally {
    loading.value = false
  }
}

// Parse response into text + code blocks + think blocks
function parseContent(text: string) {
  if (!text) return []

  const items: Array<{ type: 'text' | 'code' | 'think'; content: string; lang?: string }> = []

  // Combined regex to match both code blocks and think tags
  const combinedRegex = /```(\w+)?\n([\s\S]*?)```|<think>([\s\S]*?)<\/think>/g

  let lastIndex = 0
  let match

  while ((match = combinedRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index).trim()
    if (textBefore) {
      items.push({ type: 'text', content: textBefore })
    }

    // Check if it's a code block or think tag
    if (match[0].startsWith('```')) {
      // It's a code block
      const lang = (match[1] || 'text').toLowerCase()
      items.push({ type: 'code', content: (match[2] || '').trim(), lang })
    } else {
      // It's a think tag
      items.push({ type: 'think', content: (match[3] || '').trim() })
    }

    lastIndex = match.index + match[0].length
  }

  const remainingText = text.substring(lastIndex).trim()
  if (remainingText) {
    items.push({ type: 'text', content: remainingText })
  }

  return items
}

function clearAll() {
  prompt.value = ''
  answer.value = ''
  streamedText.value = ''
  conversation.value = []
  nextTick(() => initialInputRef.value?.focus())
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0a0e12] via-[#0d1117] to-[#161b22] relative overflow-hidden">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/3 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-12 relative z-10">

      <!-- Header -->
      <div class="text-center mb-16 animate-fadeIn">
        <div class="inline-block mb-6 relative">
          <div class="absolute inset-0 bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] rounded-3xl blur-xl opacity-50 animate-pulse"></div>
          <div class="relative w-20 h-20 mx-auto bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-float">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
        </div>
        <h1 class="text-6xl md:text-7xl font-extrabold text-white mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-gradient">
          AI Code Generator
        </h1>
        <p class="text-gray-400 text-xl md:text-2xl font-light tracking-wide">Transform your ideas into <span class="text-[#58a6ff] font-semibold">beautiful code</span> instantly</p>
      </div>

      <!-- Initial Input (Only shown when no conversation yet) -->
      <div v-if="conversation.length === 0 && !loading" class="mb-20 animate-slideUp">
        <div class="relative max-w-4xl mx-auto">
          <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m18 16 4-4-4-4"></path>
              <path d="m6 8-4 4 4 4"></path>
              <path d="m14.5 4-5 16"></path>
            </svg>
          </div>

          <input
            ref="initialInputRef"
            v-model="prompt"
            @keyup.enter="askAI"
            type="text"
            placeholder="Ask me anything... e.g., 'write a function to sum two numbers in python'"
            class="w-full pl-16 pr-40 py-5 bg-[#161b22]/80 backdrop-blur-sm border-2 border-[#30363d] rounded-2xl focus:outline-none focus:border-[#58a6ff] focus:ring-4 focus:ring-[#58a6ff]/20 transition-all text-white placeholder-gray-500 text-lg shadow-2xl hover:border-[#484f58]"
            :disabled="loading"
          />

          <button
            @click="askAI"
            :disabled="loading || !prompt.trim()"
            class="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-3 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:shadow-green-500/30 flex items-center gap-2.5 transform hover:scale-105 active:scale-95"
          >
            <span v-if="loading" class="flex items-center gap-2.5">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
            <span v-else class="flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              Generate
            </span>
          </button>
        </div>
      </div>

      <!-- Conversation History -->
      <div v-if="conversation.length > 0" class="space-y-10 animate-fadeIn mb-10">
        <template v-for="(conv, convIdx) in conversation" :key="`conv-${convIdx}`">
          <!-- User Question -->
          <div class="relative bg-gradient-to-br from-[#1a2332] via-[#161b22] to-[#0d1117] border-l-4 border-green-500 rounded-r-2xl rounded-l-lg p-6 shadow-2xl">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-green-400 font-semibold text-sm mb-2">You asked:</p>
                <p class="text-gray-100 text-base whitespace-pre-wrap">{{ conv.question }}</p>
              </div>
            </div>
          </div>

          <!-- AI Response -->
          <div class="space-y-6">
            <template v-for="(item, idx) in parseContent(conv.answer)" :key="`item-${convIdx}-${idx}`">
          <!-- Text -->
          <div v-if="item.type === 'text'" class="relative bg-gradient-to-br from-[#1a1f2e] via-[#161b22] to-[#0d1117] border-l-4 border-[#58a6ff] rounded-r-2xl rounded-l-lg p-8 shadow-2xl hover:shadow-blue-500/10 transition-all backdrop-blur-sm group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h-1.73c.34.6.73 1.26.73 2a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73V14a5 5 0 0 0-5-5v1.73c.6.34 1 .99 1 1.73a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73V9a5 5 0 0 0-5 5h1.73c-.34.6-.73 1.26-.73 2a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73H2a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                </svg>
              </div>
              <div class="flex-1 prose prose-invert max-w-none">
                <p class="text-gray-100 leading-8 text-lg whitespace-pre-wrap">{{ item.content }}</p>
              </div>
            </div>
          </div>

          <!-- Code Block -->
          <div v-else-if="item.type === 'code'" class="relative group">
            <div class="absolute -top-3 -right-3 z-20">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
            </div>
            <CodeBlock :code="item.content" :lang="item.lang || 'text'" />
          </div>

          <!-- Think Block -->
          <div v-else-if="item.type === 'think'" class="relative bg-gradient-to-br from-[#2d1b47] via-[#1e1534] to-[#0d1117] border-l-4 border-purple-500 rounded-r-2xl rounded-l-lg p-8 shadow-2xl hover:shadow-purple-500/20 transition-all backdrop-blur-sm group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-purple-400 font-bold text-sm uppercase tracking-wider">AI Thinking</span>
                  <div class="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                </div>
                <p class="text-gray-100 leading-8 text-lg font-bold whitespace-pre-wrap">{{ item.content }}</p>
              </div>
            </div>
          </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Follow-up Input (Fixed at BOTTOM with z-index when answer exists) -->
      <div v-if="conversation.length > 0 || loading" class="fixed bottom-0 left-0 right-0 z-50 pt-4 pb-6 bg-gradient-to-t from-[#0a0e12] via-[#0d1117] to-transparent backdrop-blur-md border-t border-[#30363d]/50 animate-slideUp">
        <div class="relative max-w-4xl mx-auto px-6">
          <div class="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m18 16 4-4-4-4"></path>
              <path d="m6 8-4 4 4 4"></path>
              <path d="m14.5 4-5 16"></path>
            </svg>
          </div>

          <textarea
            ref="followUpTextareaRef"
            v-model="prompt"
            @keydown.enter.exact.prevent="askAI"
            @keydown.enter.shift="(e) => { e.preventDefault(); prompt += '\n'; autoResizeTextarea(); }"
            rows="1"
            placeholder="Ask a follow-up question... (Shift + Enter for new line)"
            class="w-full pl-16 pr-40 py-5 bg-[#161b22]/95 backdrop-blur-sm border-2 border-[#30363d] rounded-2xl focus:outline-none focus:border-[#58a6ff] focus:ring-4 focus:ring-[#58a6ff]/20 transition-all text-white placeholder-gray-500 text-lg shadow-2xl hover:border-[#484f58] resize-none overflow-hidden min-h-[70px] max-h-[200px]"
            :disabled="loading"
          ></textarea>

          <button
            @click="askAI"
            :disabled="loading || !prompt.trim()"
            class="absolute right-9 top-1/2 -translate-y-1/2 z-20 px-8 py-3 bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:shadow-green-500/30 flex items-center gap-2.5 transform hover:scale-105 active:scale-95"
          >
            <span v-if="loading" class="flex items-center gap-2.5">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Generating...
            </span>
            <span v-else class="flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              Send
            </span>
          </button>
        </div>
      </div>

      <!-- Clear Button (Below response) -->
      <div v-if="conversation.length > 0 || loading" class="flex justify-center mt-10 mb-40 pb-10">
        <button
          @click="clearAll"
          class="group px-10 py-4 bg-gradient-to-r from-[#21262d] to-[#161b22] hover:from-[#30363d] hover:to-[#21262d] border-2 border-[#30363d] hover:border-[#58a6ff] rounded-2xl text-gray-300 hover:text-white font-bold transition-all shadow-2xl hover:shadow-blue-500/30 transform hover:scale-110 active:scale-95 flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-hover:rotate-180 transition-transform duration-500">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          Clear & Start New
        </button>
      </div>

      <!-- Empty State (Examples) -->
      <div v-if="conversation.length === 0 && !loading" class="text-center py-24 animate-fadeIn">
        <div class="max-w-lg mx-auto">
          <h3 class="text-2xl font-bold text-gray-300 mb-3">Ready to Generate Code</h3>
          <p class="text-gray-500 text-lg">Enter your request and watch AI create beautiful code</p>
          <div class="mt-10 space-y-3">
            <p class="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-4">Try Examples:</p>
            <button @click="prompt = 'write a Python function to check if a number is prime'" class="block w-full px-6 py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-left text-gray-400 hover:text-white transition-all hover:translate-x-2">
              <span class="text-[#58a6ff] mr-2">→</span> Prime number checker in Python
            </button>
            <button @click="prompt = 'create a responsive navbar in Tailwind CSS'" class="block w-full px-6 py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-left text-gray-400 hover:text-white transition-all hover:translate-x-2">
              <span class="text-[#58a6ff] mr-2">→</span> Responsive navbar with Tailwind
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your existing animations */
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gradient { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.animate-float { animation: float 3s ease-in-out infinite; }
.animate-fadeIn { animation: fadeIn 0.6s ease-out; }
.animate-slideUp { animation: slideUp 0.6s ease-out; }
.animate-slideDown { animation: slideDown 0.4s ease-out; }
.animate-gradient { background-size: 200% 200%; animation: gradient 5s ease infinite; }
</style>