<template>
  <view class="container fade-in">
    <view class="header">
      <view class="back-button" @tap="goBack">
        <text class="back-text">{{ t('app.back') }}</text>
      </view>
      <text class="title">{{ t('app.result') }}</text>
    </view>

    <view class="result-section">
      <view class="image-container" v-if="imageUrl">
        <image :src="imageUrl" class="result-image" mode="aspectFit" />
      </view>

      <view class="actions">
        <button class="action-button download-button" @tap="downloadImage">
          <text>{{ t('resultDisplay.actions.download') }}</text>
        </button>
        <button class="action-button use-button" @tap="useAsInput">
          <text>{{ t('resultDisplay.actions.useAsInput') }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onLoad } from '@dcloudio/uni-app'

const { t } = useI18n()
const imageUrl = ref<string>('')

onLoad((options) => {
  const cached = uni.getStorageSync('k1mage_result_image')
  if (cached) {
    imageUrl.value = cached
    return
  }

  if (options?.imageUrl) {
    imageUrl.value = decodeURIComponent(options.imageUrl as string)
  }
})

const goBack = () => {
  // @ts-ignore - uni is global in uni-app environment
  uni.navigateBack()
}

const downloadImage = () => {
  if (!imageUrl.value) return

  if (imageUrl.value.startsWith('data:')) {
    uni.showToast({
      title: 'H5 请长按图片保存',
      icon: 'none'
    })
    return
  }
  
  uni.saveImageToPhotosAlbum({
    filePath: imageUrl.value,
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

const useAsInput = () => {
  uni.navigateTo({
    url: `/pages/editor/editor?imageUrl=${encodeURIComponent(imageUrl.value)}`
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
  margin-bottom: 48rpx;
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
  color: var(--accent-primary);
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.image-container {
  width: 100%;
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border-radius: 24rpx;
  overflow: hidden;
}

.result-image {
  width: 100%;
  height: 100%;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.action-button {
  width: 100%;
  padding: 36rpx;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.download-button {
  background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
  color: var(--text-on-accent);
  box-shadow: 0 20rpx 40rpx var(--accent-shadow);
}

.use-button {
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
