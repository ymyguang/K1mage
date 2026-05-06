import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GeneratedContent } from '../types'

export const useHistoryStore = defineStore('history', () => {
  // 历史记录列表
  const history = ref<GeneratedContent[]>([])
  
  // 面板开关状态
  const isPanelOpen = ref(false)

  // 初始化 - 从本地存储读取
  const init = () => {
    try {
      const savedHistory = uni.getStorageSync('k1mage_history')
      if (savedHistory) {
        history.value = JSON.parse(savedHistory)
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }

  // 保存到本地存储
  const save = () => {
    try {
      // 只保存最近 50 条记录
      const historyToSave = history.value.slice(0, 50)
      uni.setStorageSync('k1mage_history', JSON.stringify(historyToSave))
    } catch (e) {
      console.error('Failed to save history:', e)
    }
  }

  // 添加记录
  const addRecord = (content: GeneratedContent) => {
    history.value.unshift(content)
    save()
  }

  // 删除记录
  const removeRecord = (index: number) => {
    history.value.splice(index, 1)
    save()
  }

  // 清空历史
  const clearHistory = () => {
    history.value = []
    try {
      uni.removeStorageSync('k1mage_history')
    } catch (e) {
      console.error('Failed to clear history:', e)
    }
  }

  // 切换面板
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value
  }

  // 打开面板
  const openPanel = () => {
    isPanelOpen.value = true
  }

  // 关闭面板
  const closePanel = () => {
    isPanelOpen.value = false
  }

  // 获取历史记录数量
  const historyCount = computed(() => history.value.length)

  // 检查是否有历史记录
  const hasHistory = computed(() => history.value.length > 0)

  return {
    // State
    history,
    isPanelOpen,
    
    // Getters
    historyCount,
    hasHistory,
    
    // Actions
    init,
    save,
    addRecord,
    removeRecord,
    clearHistory,
    togglePanel,
    openPanel,
    closePanel
  }
})
