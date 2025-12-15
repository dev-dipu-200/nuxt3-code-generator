// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  future: {
    compatibilityVersion: 4
  },

  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss'
  ],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://aicoderdemo-api.devtrust.biz'
    }
  },

  content: {
    highlight: {
      theme: 'github-dark',
      preload: ['js', 'ts', 'python', 'javascript', 'vue', 'bash', 'json', 'css', 'html', 'markdown', 'yaml']
    }
  },

  css: ['~/assets/css/main.css']
})