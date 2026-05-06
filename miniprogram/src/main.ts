import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import i18n from './i18n'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(i18n)

  return {
    app,
    pinia
  }
}
