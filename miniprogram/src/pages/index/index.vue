<template>
  <view class="container fade-in">
    <view v-if="!activeCategory" class="main-content">
      <text class="title">{{ t('app.title') }}</text>
      <text class="subtitle animate-up">
        {{ hasPreviousResult ? t('transformationSelector.descriptionWithResult') : t('transformationSelector.description') }}
      </text>
      <view class="grid">
        <view
          v-for="trans in transformations"
          :key="trans.key"
          class="grid-item"
          @click="handleItemClick(trans)"
        >
          <text class="emoji">{{ trans.emoji }}</text>
          <text class="item-title">{{ t(trans.titleKey) }}</text>
          <text v-if="trans.descriptionKey" class="item-desc">{{ t(trans.descriptionKey) }}</text>
        </view>
      </view>
    </view>
    <view v-else class="category-content">
      <view class="header">
        <view class="back-button" @click="activeCategory = null">
          <text class="back-text">{{ t('app.back') }}</text>
        </view>
        <text class="category-title">{{ activeCategory.emoji }} {{ t(activeCategory.titleKey) }}</text>
      </view>
      <view class="grid">
        <view
          v-for="trans in activeCategory.items"
          :key="trans.key"
          class="grid-item"
          @click="handleItemClick(trans)"
        >
          <text class="emoji">{{ trans.emoji }}</text>
          <text class="item-title">{{ t(trans.titleKey) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TRANSFORMATIONS } from '../../constants/transformations'
import type { Transformation } from '../../types'

const { t } = useI18n()
const transformations = ref<Transformation[]>(TRANSFORMATIONS)
const activeCategory = ref<Transformation | null>(null)
const hasPreviousResult = ref(false)

const handleItemClick = (item: Transformation) => {
  if (item.items && item.items.length > 0) {
    activeCategory.value = item
  } else {
    // Navigate to editor page with selected transformation
    // @ts-ignore - uni is global in uni-app environment
    uni.navigateTo({
      url: `/pages/editor/editor?key=${item.key}`
    })
  }
}
</script>

<style scoped>
.container {
  padding: 32rpx;
  min-height: 100vh;
}

.main-content, .category-content {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 24rpx;
  color: var(--accent-primary);
}

.subtitle {
  font-size: 28rpx;
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 48rpx;
  line-height: 1.6;
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

.category-title {
  font-size: 48rpx;
  font-weight: bold;
  background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 24rpx;
  aspect-ratio: 1;
  background: var(--bg-card);
  border-radius: 24rpx;
  border: 2rpx solid var(--border-primary);
  transition: all 0.2s ease-in-out;
}

.grid-item:active {
  transform: scale(0.95);
  border-color: var(--accent-primary);
}

.emoji {
  font-size: 88rpx;
  margin-bottom: 16rpx;
  transition: transform 0.2s;
}

.grid-item:active .emoji {
  transform: scale(1.1);
}

.item-title {
  font-size: 24rpx;
  font-weight: bold;
  color: var(--text-primary);
  text-align: center;
  margin-top: 8rpx;
}

.item-desc {
  margin-top: 12rpx;
  font-size: 20rpx;
  line-height: 1.4;
  color: var(--text-secondary);
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-up {
  animation: slideUp 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
