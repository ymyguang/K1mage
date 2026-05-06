/**
 * 统一存储封装 - 适配小程序 API
 */

export const storage = {
  /**
   * 获取存储值
   * @param key 存储键
   * @returns 存储值，不存在返回 null
   */
  get<T = string>(key: string): T | null {
    try {
      const value = uni.getStorageSync(key)
      return value || null
    } catch (e) {
      console.error(`Storage get failed for key "${key}":`, e)
      return null
    }
  },

  /**
   * 设置存储值
   * @param key 存储键
   * @param value 存储值
   */
  set(key: string, value: any): void {
    try {
      uni.setStorageSync(key, value)
    } catch (e) {
      console.error(`Storage set failed for key "${key}":`, e)
    }
  },

  /**
   * 移除存储值
   * @param key 存储键
   */
  remove(key: string): void {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      console.error(`Storage remove failed for key "${key}":`, e)
    }
  },

  /**
   * 清空所有存储
   */
  clear(): void {
    try {
      uni.clearStorageSync()
    } catch (e) {
      console.error('Storage clear failed:', e)
    }
  },

  /**
   * 获取存储信息
   */
  getInfo(): UniApp.GetStorageInfoSuccess {
    try {
      return uni.getStorageInfoSync()
    } catch (e) {
      console.error('Storage getInfo failed:', e)
      return { keys: [], currentSize: 0, limitSize: 0 }
    }
  }
}

/**
 * JSON 序列化存储封装
 */
export const jsonStorage = {
  /**
   * 获取 JSON 存储值
   * @param key 存储键
   * @returns 解析后的对象，不存在返回 null
   */
  get<T>(key: string): T | null {
    try {
      const value = uni.getStorageSync(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (e) {
      console.error(`JSON storage get failed for key "${key}":`, e)
      return null
    }
  },

  /**
   * 设置 JSON 存储值
   * @param key 存储键
   * @param value 要存储的对象
   */
  set(key: string, value: any): void {
    try {
      uni.setStorageSync(key, JSON.stringify(value))
    } catch (e) {
      console.error(`JSON storage set failed for key "${key}":`, e)
    }
  },

  /**
   * 移除存储值
   * @param key 存储键
   */
  remove(key: string): void {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      console.error(`JSON storage remove failed for key "${key}":`, e)
    }
  }
}

/**
 * 存储键常量
 */
export const STORAGE_KEYS = {
  API_KEY: 'k1mage_api_key',
  THEME: 'k1mage_theme',
  LOCALE: 'k1mage_locale',
  MODEL: 'k1mage_model',
  HISTORY: 'k1mage_history',
  TRANSFORMATION_ORDER: 'k1mage_transformation_order',
  RESULT_IMAGE: 'k1mage_result_image'
} as const
