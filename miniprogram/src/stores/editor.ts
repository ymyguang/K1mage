import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GeneratedContent, ImagePart } from '../types'

export const useEditorStore = defineStore('editor', () => {
  // 图片状态
  const primaryImageUrl = ref<string | null>(null)
  const secondaryImageUrl = ref<string | null>(null)
  const multiImageUrls = ref<string[]>([])
  
  // 提示词
  const customPrompt = ref('')
  
  // 宽高比
  const aspectRatio = ref<'16:9' | '9:16'>('16:9')
  const imageAspectRatio = ref<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1')
  
  // 蒙版
  const maskDataUrl = ref<string | null>(null)
  const activeTool = ref<'mask' | 'none'>('none')
  
  // 生成结果
  const generatedContent = ref<GeneratedContent | null>(null)
  
  // 多步视频选项
  const imageOptions = ref<string[] | null>(null)
  const selectedOption = ref<string | null>(null)

  // 设置主图
  const setPrimaryImage = (url: string | null) => {
    primaryImageUrl.value = url
    generatedContent.value = null
    maskDataUrl.value = null
    activeTool.value = 'none'
    imageOptions.value = null
    selectedOption.value = null
  }

  // 设置副图
  const setSecondaryImage = (url: string | null) => {
    secondaryImageUrl.value = url
    generatedContent.value = null
  }

  // 设置多图
  const setMultiImages = (urls: string[]) => {
    multiImageUrls.value = urls
    generatedContent.value = null
    imageOptions.value = null
    selectedOption.value = null
  }

  // 添加多图
  const addMultiImage = (url: string) => {
    if (multiImageUrls.value.length < 4) {
      multiImageUrls.value.push(url)
    }
  }

  // 移除多图
  const removeMultiImage = (index: number) => {
    multiImageUrls.value.splice(index, 1)
  }

  // 设置自定义提示词
  const setCustomPrompt = (prompt: string) => {
    customPrompt.value = prompt
  }

  // 设置宽高比
  const setAspectRatio = (ratio: '16:9' | '9:16') => {
    aspectRatio.value = ratio
  }

  // 设置图像宽高比
  const setImageAspectRatio = (ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4') => {
    imageAspectRatio.value = ratio
  }

  // 设置蒙版
  const setMask = (dataUrl: string | null) => {
    maskDataUrl.value = dataUrl
  }

  // 切换工具
  const toggleTool = (tool: 'mask' | 'none') => {
    activeTool.value = activeTool.value === tool ? 'none' : tool
  }

  // 设置生成结果
  const setGeneratedContent = (content: GeneratedContent | null) => {
    generatedContent.value = content
  }

  // 设置图片选项（多步视频）
  const setImageOptions = (options: string[] | null) => {
    imageOptions.value = options
    selectedOption.value = null
  }

  // 选择选项
  const selectOption = (option: string | null) => {
    selectedOption.value = option
  }

  // 清除所有
  const clearAll = () => {
    primaryImageUrl.value = null
    secondaryImageUrl.value = null
    multiImageUrls.value = []
    customPrompt.value = ''
    maskDataUrl.value = null
    activeTool.value = 'none'
    generatedContent.value = null
    imageOptions.value = null
    selectedOption.value = null
  }

  // 检查是否可以生成
  const canGenerate = computed(() => {
    return !!primaryImageUrl.value || multiImageUrls.value.length > 0
  })

  // 获取图片部分
  const getImageParts = (): ImagePart[] => {
    const parts: ImagePart[] = []
    
    if (primaryImageUrl.value) {
      parts.push({
        base64: primaryImageUrl.value.split(',')[1],
        mimeType: primaryImageUrl.value.split(';')[0].split(':')[1] || 'image/png'
      })
    }
    
    if (secondaryImageUrl.value) {
      parts.push({
        base64: secondaryImageUrl.value.split(',')[1],
        mimeType: secondaryImageUrl.value.split(';')[0].split(':')[1] || 'image/png'
      })
    }
    
    return parts
  }

  // 获取多图部分
  const getMultiImageParts = (): ImagePart[] => {
    return multiImageUrls.value.map(url => ({
      base64: url.split(',')[1],
      mimeType: url.split(';')[0].split(':')[1] || 'image/png'
    }))
  }

  return {
    // State
    primaryImageUrl,
    secondaryImageUrl,
    multiImageUrls,
    customPrompt,
    aspectRatio,
    imageAspectRatio,
    maskDataUrl,
    activeTool,
    generatedContent,
    imageOptions,
    selectedOption,
    
    // Getters
    canGenerate,
    
    // Actions
    setPrimaryImage,
    setSecondaryImage,
    setMultiImages,
    addMultiImage,
    removeMultiImage,
    setCustomPrompt,
    setAspectRatio,
    setImageAspectRatio,
    setMask,
    toggleTool,
    setGeneratedContent,
    setImageOptions,
    selectOption,
    clearAll,
    getImageParts,
    getMultiImageParts
  }
})
