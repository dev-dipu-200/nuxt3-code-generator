<script setup lang="ts">
const prompt = ref('')
const answer = ref('')
const loading = ref(false)
const streamedText = ref('')

async function askAI() {
  if (!prompt.value.trim()) return

  loading.value = true
  answer.value = ''
  streamedText.value = ''

  try {
    const res = await $fetch('http://localhost:8000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { question: prompt.value }
    })

    // Simulate streaming effect for better UX
    const fullAnswer = res.answer
    let currentIndex = 0
    const streamInterval = setInterval(() => {
      if (currentIndex < fullAnswer.length) {
        streamedText.value += fullAnswer[currentIndex]
        currentIndex++
      } else {
        clearInterval(streamInterval)
        answer.value = fullAnswer
        streamedText.value = ''
      }
    }, 10)

  } catch (err) {
    answer.value = 'Error: Could not connect to backend (localhost:8000)'
  } finally {
    loading.value = false
  }
}

// Parse response into mixed content (text + code blocks in order)
const parsedContent = computed(() => {
  const text = answer.value || streamedText.value
  if (!text) return []

  const items: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = []
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before this code block
    const textBefore = text.substring(lastIndex, match.index).trim()
    if (textBefore) {
      items.push({ type: 'text', content: textBefore })
    }

    // Add code block
    const lang = (match[1] || 'text').toLowerCase()
    items.push({ type: 'code', content: match[2].trim(), lang })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last code block
  const remainingText = text.substring(lastIndex).trim()
  if (remainingText) {
    items.push({ type: 'text', content: remainingText })
  }

  return items
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0a0e12] via-[#0d1117] to-[#161b22] relative overflow-hidden">
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/3 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-12 relative z-10">

      <!-- Header -->
      <div class="text-center mb-16 animate-fadeIn">
        <div class="inline-block mb-6 relative">
          <!-- Glow effect -->
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

        <!-- Stats/Features -->
        <div class="flex flex-wrap justify-center gap-6 mt-8">
          <div class="flex items-center gap-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-sm">Syntax Highlighting</span>
          </div>
          <div class="flex items-center gap-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-sm">Instant Copy</span>
          </div>
          <div class="flex items-center gap-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-sm">Multi-Language</span>
          </div>
        </div>
      </div>

      <!-- Input Section -->
      <div class="mb-16 animate-slideUp">
        <div class="relative max-w-4xl mx-auto">
          <!-- Search Icon -->
          <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 16 4-4-4-4"></path>
              <path d="m6 8-4 4 4 4"></path>
              <path d="m14.5 4-5 16"></path>
            </svg>
          </div>

          <input
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              Generate
            </span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !streamedText && !answer" class="text-center py-16">
        <div class="inline-block relative">
          <div class="flex items-center gap-4 text-gray-400 mb-4">
            <div class="w-3 h-3 bg-[#58a6ff] rounded-full animate-bounce shadow-lg shadow-blue-500/50" style="animation-delay: 0ms"></div>
            <div class="w-3 h-3 bg-[#58a6ff] rounded-full animate-bounce shadow-lg shadow-blue-500/50" style="animation-delay: 150ms"></div>
            <div class="w-3 h-3 bg-[#58a6ff] rounded-full animate-bounce shadow-lg shadow-blue-500/50" style="animation-delay: 300ms"></div>
          </div>
          <p class="text-gray-500 text-sm animate-pulse">Creating amazing code for you...</p>
        </div>
      </div>

      <!-- Results -->
      <div v-if="answer || streamedText" class="space-y-6 animate-fadeIn">
        <!-- Mixed content: Text and Code in order -->
        <template v-for="(item, idx) in parsedContent" :key="`item-${idx}`">

          <!-- Text Section - Unique Card Style -->
          <div v-if="item.type === 'text'"
               class="relative bg-gradient-to-br from-[#1a1f2e] via-[#161b22] to-[#0d1117] border-l-4 border-[#58a6ff] rounded-r-2xl rounded-l-lg p-8 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm group">
            <!-- Decorative Quote Icon -->
            <div class="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="text-blue-400">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
              </svg>
            </div>

            <div class="flex items-start gap-5 relative z-10">
              <!-- AI Icon Badge -->
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h-1.73c.34.6.73 1.26.73 2a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73V14a5 5 0 0 0-5-5v1.73c.6.34 1 .99 1 1.73a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73V9a5 5 0 0 0-5 5h1.73c-.34.6-.73 1.26-.73 2a2 2 0 0 1-4 0c0-.74.4-1.39 1-1.73H2a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                </svg>
              </div>

              <!-- Text Content -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-xs font-bold uppercase tracking-wider text-blue-400">AI Response</span>
                  <div class="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
                </div>
                <div class="prose prose-invert max-w-none">
                  <p class="text-gray-100 leading-8 text-lg font-normal whitespace-pre-wrap m-0 selection:bg-blue-500/30">
                    {{ item.content }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Code Section - Different Unique Style -->
          <div v-else-if="item.type === 'code'" class="relative group">
            <!-- Decorative Corner Badge -->
            <div class="absolute -top-3 -right-3 z-20">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg shadow-green-500/30 flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
            </div>

            <CodeBlock
              :code="item.content"
              :lang="item.lang || 'text'"
            />
          </div>

        </template>

        <!-- Clear Button - More Beautiful & Centered -->
        <div class="flex justify-center pt-12">
          <button
            @click="() => { answer = ''; streamedText = ''; prompt = '' }"
            class="group relative px-10 py-4 bg-gradient-to-r from-[#21262d] to-[#161b22] hover:from-[#30363d] hover:to-[#21262d] border-2 border-[#30363d] hover:border-[#58a6ff] rounded-2xl text-gray-300 hover:text-white font-bold transition-all duration-300 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/30 transform hover:scale-110 active:scale-95"
          >
            <span class="flex items-center gap-3 text-base">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-180 transition-transform duration-500">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Clear & Ask Another Question
            </span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!answer && !streamedText && !loading" class="text-center py-24 animate-fadeIn">
        <div class="max-w-lg mx-auto">
          <div class="relative inline-block mb-8">
            <div class="absolute inset-0 bg-gradient-to-br from-[#58a6ff] to-[#1f6feb] rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div class="relative w-32 h-32 mx-auto bg-gradient-to-br from-[#161b22] to-[#0d1117] rounded-full flex items-center justify-center border-2 border-[#30363d] shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-float">
                <path d="m18 16 4-4-4-4"></path>
                <path d="m6 8-4 4 4 4"></path>
                <path d="m14.5 4-5 16"></path>
              </svg>
            </div>
          </div>
          <h3 class="text-2xl font-bold text-gray-300 mb-3">Ready to Generate Code</h3>
          <p class="text-gray-500 text-lg leading-relaxed">Enter your request above and watch AI create <br class="hidden md:block">beautiful, syntax-highlighted code for you</p>

          <!-- Example Prompts -->
          <div class="mt-10 space-y-3">
            <p class="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-4">Try Examples:</p>
            <button
              @click="prompt = 'write a function to sum two numbers in python'"
              class="block w-full px-6 py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-gray-400 hover:text-white text-left transition-all duration-200 hover:translate-x-2"
            >
              <span class="text-[#58a6ff] mr-2">→</span> Sum two numbers in Python
            </button>
            <button
              @click="prompt = 'create a react component for a todo list'"
              class="block w-full px-6 py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-gray-400 hover:text-white text-left transition-all duration-200 hover:translate-x-2"
            >
              <span class="text-[#58a6ff] mr-2">→</span> React todo list component
            </button>
            <button
              @click="prompt = 'write a fibonacci function in javascript'"
              class="block w-full px-6 py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff] rounded-xl text-gray-400 hover:text-white text-left transition-all duration-200 hover:translate-x-2"
            >
              <span class="text-[#58a6ff] mr-2">→</span> Fibonacci in JavaScript
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

@keyframes gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.6s ease-out;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 5s ease infinite;
}
</style>