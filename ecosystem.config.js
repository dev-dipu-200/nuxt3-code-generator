module.exports = {
  apps: [{
    name: "nuxt3-code-generator",
    exec_mode: "fork",
    instances: 1,
    script: ".output/server/index.mjs",
    env: {
      NODE_ENV: "production",
      NUXT_PUBLIC_API_BASE_URL: "https://aicoderdemo-api.devtrust.biz"
    }
  }]
}
