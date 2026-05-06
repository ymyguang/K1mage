import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // API Key
  const apiKey = ref('')
  
  // 主题
  const theme = ref<'light' | 'dark'>('dark')
  
  // 语言
  const locale = ref<'zh' | 'en'>('zh')
  
  // 当前选择的模型
  const selectedModel = ref('gemini-2.5-flash-image')
  
  // 加载状态
  const isLoading = ref(false)
  const loadingMessage = ref('')
  
  // 错误状态
  const error = ref<string | null>(null)

  // 初始化 - 从本地存储读取
  const init = () => {
    try {
      const savedApiKey = uni.getStorageSync('k1mage_api_key')
      if (savedApiKey) apiKey.value = savedApiKey

      const savedTheme = uni.getStorageSync('k1mage_theme')
      if (savedTheme) theme.value = savedTheme

      const savedLocale = uni.getStorageSync('k1mage_locale')
      if (savedLocale) locale.value = savedLocale

      const savedModel = uni.getStorageSync('k1mage_model')
      if (savedModel) selectedModel.value = savedModel
    } catch (e) {
      console.error('Failed to load app state:', e)
    }
  }

  // 保存 API Key
  const setApiKey = (key: string) => {
    apiKey.value = key
    try {
      uni.setStorageSync('k1mage_api_key', key)
    } catch (e) {
      console.error('Failed to save API key:', e)
    }
  }

  // 切换主题
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try {
      uni.setStorageSync('k1mage_theme', theme.value)
    } catch (e) {
      console.error('Failed to save theme:', e)
    }
  }

  // 设置语言
  const setLocale = (newLocale: 'zh' | 'en') => {
    locale.value = newLocale
    try {
      uni.setStorageSync('k1mage_locale', newLocale)
    } catch (e) {
      console.error('Failed to save locale:', e)
    }
  }

  // 设置模型
  const setModel = (model: string) => {
    selectedModel.value = model
    try {
      uni.setStorageSync('k1mage_model', model)
    } catch (e) {
      console.error('Failed to save model:', e)
    }
  }

  // 设置加载状态
  const setLoading = (loading: boolean, message: string = '') => {
    isLoading.value = loading
    loadingMessage.value = message
  }

  // 设置错误
  const setError = (err: string | null) => {
    error.value = err
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    apiKey,
    theme,
    locale,
    selectedModel,
    isLoading,
    loadingMessage,
    error,
    
    // Getters
    isDarkTheme: computed(() => theme.value === 'dark'),
    
    // Actions
    init,
    setApiKey,
    toggleTheme,
    setLocale,
    setModel,
    setLoading,
    setError,
    clearError
  }
})
