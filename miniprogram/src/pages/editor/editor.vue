<template>
  <view class="container fade-in">
    <view class="header">
      <view class="back-button" @click="goBack">
        <text class="back-text">{{ t('app.back') }}</text>
      </view>
      <text class="title">{{ selectedTransformation?.emoji }} {{ selectedTransformation ? t(selectedTransformation.titleKey) : '' }}</text>
    </view>

    <view class="content-grid">
      <view class="input-column">
        <view class="card">
          <view class="card-header">
            <text class="card-title">{{ t('app.apiKey') }}</text>
          </view>
          <input
            v-model="apiKey"
            class="api-key-input"
            type="text"
            password
            placeholder="请输入 Gemini API Key"
          />
        </view>

        <view class="card">
          <view class="card-header">
            <text class="card-title">{{ t('imageEditor.upload') }}</text>
          </view>
          <view class="upload-area" @tap="chooseImage" v-if="!imageUrl">
            <text class="upload-icon">📷</text>
            <text class="upload-text">{{ t('imageEditor.dragAndDrop') }}</text>
          </view>

          <view class="image-container" v-else>
            <image :src="imageUrl" class="preview-image" mode="aspectFit" />
            <view class="clear-button" @tap="clearImage">
              <text class="clear-icon">×</text>
            </view>
          </view>
        </view>

        <view class="card" v-if="selectedTransformation?.prompt === 'CUSTOM'">
          <view class="card-header">
            <text class="card-title">{{ t('transformations.effects.customPrompt.title') }}</text>
          </view>
          <textarea
            v-model="customPrompt"
            :placeholder="t('transformations.effects.customPrompt.description')"
            class="prompt-input"
          />
        </view>

        <view class="card">
          <view class="card-header">
            <text class="card-title">Model</text>
          </view>
          <view class="model-selector">
            <view 
              class="model-option active"
              @click="selectedModel = 'gemini-2.5-flash-image'"
            >
              <text class="model-name">Nano Banana</text>
            </view>
            <view 
              class="model-option"
              @click="selectedModel = 'gemini-3-pro-image-preview'"
            >
              <text class="model-name">Nano Banana Pro</text>
            </view>
          </view>
        </view>

        <button class="generate-button" @tap="handleGenerate" :disabled="isGenerateDisabled">
          <text v-if="isLoading">{{ t('app.generating') }}</text>
          <text v-else>{{ t('app.generateImage') }}</text>
        </button>
      </view>

      <view class="output-column">
        <view class="card output-card">
          <view class="card-header">
            <text class="card-title">{{ t('app.result') }}</text>
          </view>
          <view class="output-placeholder" v-if="!isLoading && !generatedImage">
            <text class="placeholder-icon">🖼️</text>
            <text class="placeholder-text">{{ t('app.yourImageWillAppear') }}</text>
          </view>
          <view class="loading-spinner" v-if="isLoading">
            <text class="loading-text">{{ t('app.loading.default') }}</text>
          </view>
          <view class="result-container" v-if="generatedImage">
            <image :src="generatedImage" class="result-image" mode="aspectFit" />
            <view class="result-actions">
              <button class="action-btn" @tap="downloadResult">
                <text>{{ t('resultDisplay.actions.download') }}</text>
              </button>
              <button class="action-btn secondary" @tap="useResultAsInput">
                <text>{{ t('resultDisplay.actions.useAsInput') }}</text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onLoad } from '@dcloudio/uni-app'
import { TRANSFORMATIONS } from '../../constants/transformations'
import { editImage, generateImageFromText } from '../../services/api'
import type { Transformation } from '../../types'

const { t } = useI18n()
const selectedTransformation = ref<Transformation | null>(null)
const imageUrl = ref<string>('')
const customPrompt = ref<string>('')
const isLoading = ref(false)
const apiKey = ref('')
const selectedModel = ref('gemini-2.5-flash-image')
const generatedImage = ref<string>('')

const isGenerateDisabled = computed(() => {
  if (isLoading.value) return true
  if (!apiKey.value.trim()) return true
  if (!selectedTransformation.value) return true
  if (selectedTransformation.value.prompt === 'CUSTOM') {
    return !customPrompt.value.trim() && !imageUrl.value
  }
  return !imageUrl.value
})

onLoad((options) => {
  if (options?.key) {
    const key = options.key as string
    selectedTransformation.value = TRANSFORMATIONS.find(t => t.key === key) || null
  }

  if (options?.imageUrl) {
    imageUrl.value = decodeURIComponent(options.imageUrl as string)
  }
})

const goBack = () => {
  // @ts-ignore - uni is global in uni-app environment
  uni.navigateBack()
}

const chooseImage = () => {
  // @ts-ignore - uni is global in uni-app environment
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed', 'original'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      imageUrl.value = res.tempFilePaths[0]
    }
  })
}

const clearImage = () => {
  imageUrl.value = ''
  customPrompt.value = ''
}

const handleGenerate = async () => {
  if (!selectedTransformation.value) return

  isLoading.value = true
  try {
    if (!apiKey.value.trim()) {
      uni.showToast({
        title: '请先输入 API Key',
        icon: 'none'
      })
      return
    }

    const promptToUse = selectedTransformation.value.prompt === 'CUSTOM'
      ? customPrompt.value 
      : selectedTransformation.value.prompt

    if (!promptToUse?.trim()) {
      // @ts-ignore - uni is global in uni-app environment
      uni.showToast({
        title: t('app.error.enterPrompt'),
        icon: 'none'
      })
      isLoading.value = false
      return
    }

    let result

    if (selectedTransformation.value.prompt === 'CUSTOM' && !imageUrl.value) {
      result = await generateImageFromText(promptToUse, '1:1', 'gemini-2.5-flash-image', apiKey.value)
    } else {
      if (!imageUrl.value) {
        uni.showToast({
          title: t('app.error.uploadOne'),
          icon: 'none'
        })
        return
      }

      const base64Data = await imageToBase64(imageUrl.value)
      const imageParts = [{
        base64: base64Data.split(',')[1],
        mimeType: base64Data.split(';')[0].split(':')[1] || 'image/jpeg'
      }]

      result = await editImage(promptToUse, imageParts, null, 'gemini-2.5-flash-image', apiKey.value)
    }

    if (result.imageUrl) {
      generatedImage.value = result.imageUrl
      uni.setStorageSync('k1mage_result_image', result.imageUrl)
    } else {
      uni.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('Generation error:', error)
    // @ts-ignore - uni is global in uni-app environment
    uni.showToast({
      title: error instanceof Error ? error.message : t('app.error.unknown'),
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const imageToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - uni is global in uni-app environment
    uni.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        resolve(`data:image/jpeg;base64,${res.data}`)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

const downloadResult = () => {
  if (!generatedImage.value) return
  
  if (generatedImage.value.startsWith('data:')) {
    uni.showToast({
      title: 'H5 请长按图片保存',
      icon: 'none'
    })
    return
  }
  
  uni.saveImageToPhotosAlbum({
    filePath: generatedImage.value,
    success: () => {
      uni.showToast({
        title: '已保存到相册',
        icon: 'success'
      })
    },
    fail: (err) => {
      console.error('Save failed:', err)
      uni.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  })
}

const useResultAsInput = () => {
  uni.navigateTo({
    url: `/pages/editor/editor?key=${selectedTransformation.value?.key}&imageUrl=${encodeURIComponent(generatedImage.value)}`
  })
}
</script>

<style scoped>
.container {
  padding: 32rpx;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  padding: 24rpx 0;
}

.back-button {
  padding: 12rpx 24rpx;
  margin-right: 24rpx;
}

.back-text {
  color: var(--accent-primary);
  font-size: 28rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32rpx;
}

@media (min-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.input-column, .output-column {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card {
  background: var(--bg-card-alpha);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  border: 2rpx solid var(--border-primary);
  padding: 32rpx;
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.api-key-input {
  width: 100%;
  background: var(--bg-secondary);
  border: 2rpx solid var(--border-primary);
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: var(--text-primary);
}

.upload-area {
  width: 100%;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border: 2rpx dashed var(--border-primary);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.upload-area:active {
  border-color: var(--accent-primary);
}

.upload-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.upload-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border-radius: 24rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.clear-button {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 64rpx;
  height: 64rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon {
  color: white;
  font-size: 48rpx;
  font-weight: bold;
}

.prompt-input {
  width: 100%;
  min-height: 180rpx;
  padding: 24rpx;
  background: var(--bg-secondary);
  border-radius: 20rpx;
  border: 2rpx solid var(--border-primary);
  font-size: 28rpx;
  color: var(--text-primary);
}

.model-selector {
  display: flex;
  gap: 16rpx;
}

.model-option {
  flex: 1;
  padding: 20rpx;
  background: var(--bg-secondary);
  border: 2rpx solid var(--border-primary);
  border-radius: 20rpx;
  text-align: center;
  transition: all 0.2s;
}

.model-option.active {
  background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
  border-color: transparent;
}

.model-name {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.model-option.active .model-name {
  color: var(--text-on-accent);
}

.generate-button {
  width: 100%;
  padding: 36rpx;
  background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
  border-radius: 24rpx;
  color: var(--text-on-accent);
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20rpx 40rpx var(--accent-shadow);
  transition: all 0.2s;
}

.generate-button:active {
  transform: scale(0.98);
}

.generate-button[disabled] {
  opacity: 0.5;
}

.output-card {
  min-height: 600rpx;
}

.output-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500rpx;
  color: var(--text-tertiary);
}

.placeholder-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.placeholder-text {
  font-size: 28rpx;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500rpx;
}

.loading-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.result-image {
  width: 100%;
  border-radius: 20rpx;
  background: var(--bg-secondary);
}

.result-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  padding: 28rpx;
  background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
  border-radius: 20rpx;
  color: var(--text-on-accent);
  font-size: 28rpx;
  font-weight: 600;
}

.action-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2rpx solid var(--border-primary);
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
