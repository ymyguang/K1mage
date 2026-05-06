import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TRANSFORMATIONS } from '../constants/transformations'
import type { Transformation } from '../types'

export const useTransformationStore = defineStore('transformation', () => {
  // 效果列表
  const transformations = ref<Transformation[]>([])
  
  // 当前选中的效果
  const selectedTransformation = ref<Transformation | null>(null)
  
  // 当前活跃的分类
  const activeCategory = ref<Transformation | null>(null)

  // 初始化 - 从本地存储读取排序
  const init = () => {
    try {
      const savedOrder = uni.getStorageSync('k1mage_transformation_order')
      if (savedOrder) {
        const orderedKeys = JSON.parse(savedOrder) as string[]
        const transformationMap = new Map(TRANSFORMATIONS.map(t => [t.key, t]))
        
        const orderedTransformations = orderedKeys
          .map(key => transformationMap.get(key))
          .filter((t): t is Transformation => !!t)

        const savedKeysSet = new Set(orderedKeys)
        const newTransformations = TRANSFORMATIONS.filter(t => !savedKeysSet.has(t.key))
        
        transformations.value = [...orderedTransformations, ...newTransformations]
      } else {
        transformations.value = [...TRANSFORMATIONS]
      }
    } catch (e) {
      console.error('Failed to load transformation order:', e)
      transformations.value = [...TRANSFORMATIONS]
    }
  }

  // 保存排序
  const saveOrder = () => {
    try {
      const orderToSave = transformations.value.map(t => t.key)
      uni.setStorageSync('k1mage_transformation_order', JSON.stringify(orderToSave))
    } catch (e) {
      console.error('Failed to save transformation order:', e)
    }
  }

  // 选择效果
  const selectTransformation = (transformation: Transformation) => {
    selectedTransformation.value = transformation
    activeCategory.value = null
  }

  // 进入分类
  const enterCategory = (category: Transformation) => {
    activeCategory.value = category
  }

  // 返回上级
  const goBack = () => {
    if (activeCategory.value) {
      activeCategory.value = null
    } else {
      selectedTransformation.value = null
    }
  }

  // 重置选择
  const resetSelection = () => {
    selectedTransformation.value = null
    activeCategory.value = null
  }

  // 获取当前显示的效果列表
  const currentTransformations = computed(() => {
    if (activeCategory.value?.items) {
      return activeCategory.value.items
    }
    return transformations.value
  })

  // 检查是否有上一个结果
  const hasPreviousResult = ref(false)

  return {
    // State
    transformations,
    selectedTransformation,
    activeCategory,
    hasPreviousResult,
    
    // Getters
    currentTransformations,
    
    // Actions
    init,
    saveOrder,
    selectTransformation,
    enterCategory,
    goBack,
    resetSelection
  }
})
