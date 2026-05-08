const { API_BASE_URL, request, loadTemplateCatalog } = require('../../utils/templateCatalog')
const { ensureLoggedIn, fetchCurrentUser, getStoredUser } = require('../../utils/auth')
const DEFAULT_MODEL = 'openai/gpt-image-2'

function getHistoryRecordCacheKey(recordId) {
  return `k1mage_history_record_${recordId}`
}

function getHistoryInputCacheKey(recordId) {
  return `k1mage_history_inputs_${recordId}`
}

function getMimeType(path) {
  const lower = String(path || '').toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function readFileAsBase64(path) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: ({ data }) => resolve(data),
      fail: reject,
    })
  })
}

function writeBase64ImageToFile(imageUrl, recordId) {
  const match = String(imageUrl || '').match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) {
    return Promise.resolve('')
  }

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const filePath = `${wx.env.USER_DATA_PATH}/k1mage-history-result-${recordId || Date.now()}.${ext}`

  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().writeFile({
      filePath,
      data: match[2],
      encoding: 'base64',
      success: () => resolve(filePath),
      fail: reject,
    })
  })
}

function parseInputImagesPreview(value) {
  if (!value) return []
  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

Page({
  data: {
    apiBaseUrl: API_BASE_URL,
    templateId: '',
    selectedTemplate: null,
    selectedImages: [],
    customPrompt: '',
    user: null,
    isLoadingTemplate: true,
    isGenerating: false,
    resultImagePath: '',
    lastCostPoints: 0,
    lastRemainingPoints: null,
    errorMessage: '',
    historyMode: false,
    historyRecord: null,
    historyStatusLabel: '',
  },

  onLoad(options) {
    const recordId = options.recordId ? Number(options.recordId) : 0
    this.setData({
      templateId: decodeURIComponent(options.id || ''),
      historyMode: options.mode === 'history' && recordId > 0,
    })
    this.loadTemplate()
    if (recordId > 0) {
      this.loadHistoryRecord(recordId)
    }
  },

  onShow() {
    this.refreshUser()
  },

  async refreshUser() {
    this.setData({ user: getStoredUser() })
    const user = await fetchCurrentUser()
    getApp().globalData.user = user
    this.setData({ user })
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }

    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  async loadTemplate() {
    this.setData({ isLoadingTemplate: true, errorMessage: '' })

    try {
      const templates = await loadTemplateCatalog({ sort: 'order' })
      const selectedTemplate = templates.find((template) => template.id === this.data.templateId)

      if (!selectedTemplate) {
        throw new Error('没有找到这个玩法')
      }

      this.setData({ selectedTemplate })
    } catch (error) {
      this.setData({ errorMessage: this.formatError(error, '玩法加载失败') })
    } finally {
      this.setData({ isLoadingTemplate: false })
    }
  },

  async loadHistoryRecord(recordId) {
    const record = wx.getStorageSync(getHistoryRecordCacheKey(recordId))
    if (!record) {
      this.setData({ errorMessage: '这条历史记录暂时无法打开，请返回历史记录刷新后再试' })
      return
    }

    const cachedImages = wx.getStorageSync(getHistoryInputCacheKey(recordId)) || []
    const previewImages = await this.resolveHistoryInputImages(record)
    const selectedImages = cachedImages.length > 0 ? cachedImages : previewImages
    let resultImagePath = ''

    if (record.status === 'success' && record.output_url) {
      try {
        resultImagePath = await this.resolveHistoryResultImage(record.output_url, record.id)
      } catch (error) {
        resultImagePath = ''
      }
    }

    const placeholders = selectedImages.length > 0
      ? selectedImages
      : Array.from({ length: Number(record.input_images_count || 0) }).map((_, index) => ({
          placeholder: true,
          label: `原图 ${index + 1}`,
        }))

    this.setData({
      historyRecord: record,
      selectedImages: placeholders,
      customPrompt: record.prompt || '',
      isGenerating: record.status === 'pending',
      resultImagePath,
      lastCostPoints: record.cost_points || 0,
      lastRemainingPoints: null,
      historyStatusLabel: this.formatStatus(record.status),
      errorMessage: record.status === 'failed' ? (record.error_message || '生成失败') : '',
    })
  },

  async resolveHistoryInputImages(record) {
    const previews = parseInputImagesPreview(record.input_images_preview)
    if (previews.length === 0) {
      return []
    }

    const images = []
    for (let index = 0; index < previews.length; index += 1) {
      const item = previews[index]
      const dataUrl = item && (item.dataUrl || item.url)
      if (!dataUrl) continue

      try {
        const path = await writeBase64ImageToFile(dataUrl, `${record.id}-input-${index}`)
        if (path) {
          images.push({ path, size: 0 })
        }
      } catch (error) {
        // Ignore a single broken preview and keep rendering the rest of the record.
      }
    }

    return images
  },

  async resolveHistoryResultImage(outputUrl, recordId) {
    const value = String(outputUrl || '')
    if (value.startsWith('data:image/')) {
      return writeBase64ImageToFile(value, recordId)
    }

    if (value.startsWith('http')) {
      return this.downloadImageToTempFile(value)
    }

    return value
  },

  formatStatus(status) {
    if (status === 'success') return '已完成'
    if (status === 'failed') return '失败'
    return '生成中'
  },

  onPromptInput(event) {
    this.setData({ customPrompt: event.detail.value })
  },

  chooseImages() {
    if (this.data.historyMode) return

    const { selectedTemplate, selectedImages } = this.data
    const maxImages = selectedTemplate ? selectedTemplate.maxImages || 1 : 1
    const remaining = Math.max(maxImages - selectedImages.length, 0)

    if (remaining <= 0) {
      wx.showToast({ title: `最多上传 ${maxImages} 张`, icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const incoming = (res.tempFiles || []).map((file) => ({
          path: file.tempFilePath,
          size: file.size || 0,
        }))
        this.setData({
          selectedImages: selectedImages.concat(incoming).slice(0, maxImages),
          resultImagePath: '',
          errorMessage: '',
        })
      },
    })
  },

  removeImage(event) {
    if (this.data.historyMode) return

    const { index } = event.currentTarget.dataset
    const selectedImages = this.data.selectedImages.filter((_, imageIndex) => imageIndex !== index)
    this.setData({ selectedImages, resultImagePath: '', errorMessage: '' })
  },

  async handleLogin() {
    try {
      this.setData({ isGenerating: true, errorMessage: '' })
      const user = await ensureLoggedIn()
      getApp().globalData.user = user
      this.setData({ user, errorMessage: '' })
      wx.showToast({ title: '登录成功' })
    } catch (error) {
      this.setData({ errorMessage: this.formatError(error, '登录失败') })
    } finally {
      this.setData({ isGenerating: false })
    }
  },

  async generateImage() {
    const { selectedTemplate, selectedImages, customPrompt } = this.data
    if (!selectedTemplate) {
      this.setData({ errorMessage: '请先选择一个玩法模板' })
      return
    }

    if (!selectedTemplate.isCustom && (selectedTemplate.maxImages || 1) > 0 && selectedImages.length === 0) {
      this.setData({ errorMessage: '请先上传图片' })
      return
    }

    if (selectedTemplate.isCustom && !customPrompt.trim()) {
      this.setData({ errorMessage: '请输入想生成的效果描述' })
      return
    }

    this.setData({ isGenerating: true, errorMessage: '', resultImagePath: '' })

    try {
      const user = await ensureLoggedIn()
      getApp().globalData.user = user
      this.setData({ user })

      const images = await Promise.all(selectedImages.map(async (image) => ({
        mimeType: getMimeType(image.path),
        base64: await readFileAsBase64(image.path),
      })))

      const body = {
        templateId: selectedTemplate.id,
        model: DEFAULT_MODEL,
        images,
        useResponsesApi: false,
        aspectRatio: images.length > 1 ? '1:1' : 'auto',
        quality: 'low',
        output_format: 'jpeg',
        output_compression: images.length > 1 ? 75 : 85,
      }

      if (selectedTemplate.isCustom) {
        body.prompt = customPrompt.trim()
      }

      const response = await request({
        url: '/api/image/generate',
        method: 'POST',
        data: body,
      })

      const resultImagePath = await this.persistResultImage(response)
      if (response.generationRecordId) {
        await this.persistHistoryInputImages(response.generationRecordId, selectedImages)
      }
      const remaining = response.points && response.points.remaining
      this.setData({
        resultImagePath,
        lastCostPoints: response.points ? response.points.cost : 0,
        lastRemainingPoints: remaining === undefined ? null : remaining,
      })
      await this.refreshUser()
    } catch (error) {
      if (error.generationRecordId) {
        await this.persistHistoryInputImages(error.generationRecordId, selectedImages)
      }
      this.setData({ errorMessage: this.formatError(error, '生成失败') })
    } finally {
      this.setData({ isGenerating: false })
    }
  },

  async persistHistoryInputImages(recordId, selectedImages) {
    if (!recordId || !Array.isArray(selectedImages) || selectedImages.length === 0) return

    const storedImages = []
    for (let index = 0; index < selectedImages.length; index += 1) {
      const image = selectedImages[index]
      if (!image.path) continue

      const ext = String(image.path).toLowerCase().includes('.png') ? 'png' : 'jpg'
      const targetPath = `${wx.env.USER_DATA_PATH}/k1mage-input-${recordId}-${index}.${ext}`
      try {
        await new Promise((resolve, reject) => {
          wx.getFileSystemManager().copyFile({
            srcPath: image.path,
            destPath: targetPath,
            success: resolve,
            fail: reject,
          })
        })
        storedImages.push({ path: targetPath, size: image.size || 0 })
      } catch (error) {
        storedImages.push(image)
      }
    }

    wx.setStorageSync(getHistoryInputCacheKey(recordId), storedImages)
  },

  async persistResultImage(response) {
    const imageUrl = response && (response.imageUrl || response.url || response.data)
    if (!imageUrl) {
      throw new Error('后端没有返回图片')
    }

    if (!String(imageUrl).startsWith('data:image/')) {
      const resolvedUrl = String(imageUrl).startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`
      return this.downloadImageToTempFile(resolvedUrl)
    }

    const match = String(imageUrl).match(/^data:image\/(\w+);base64,(.+)$/)
    if (!match) {
      throw new Error('图片返回格式不正确')
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
    const filePath = `${wx.env.USER_DATA_PATH}/k1mage-result-${Date.now()}.${ext}`

    await new Promise((resolve, reject) => {
      wx.getFileSystemManager().writeFile({
        filePath,
        data: match[2],
        encoding: 'base64',
        success: resolve,
        fail: reject,
      })
    })

    return filePath
  },

  previewResult() {
    if (!this.data.resultImagePath) return
    wx.previewImage({
      urls: [this.data.resultImagePath],
      current: this.data.resultImagePath,
    })
  },

  async saveResult() {
    const { resultImagePath } = this.data
    if (!resultImagePath) return

    wx.showLoading({ title: '保存中', mask: true })

    try {
      const filePath = await this.resolveSaveableImagePath(resultImagePath)

      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath,
          success: resolve,
          fail: reject,
        })
      })

      wx.showToast({ title: '已保存' })
    } catch (error) {
      const message = error && (error.errMsg || error.message || '')
      const needAuth = message.includes('auth') || message.includes('authorize') || message.includes('permission')
      wx.showToast({
        title: needAuth ? '请允许相册权限后重试' : '保存失败，请稍后重试',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  resolveSaveableImagePath(imagePath) {
    if (!String(imagePath).startsWith('http')) {
      return Promise.resolve(imagePath)
    }

    return this.downloadImageToTempFile(imagePath)
  },

  downloadImageToTempFile(imagePath) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: imagePath,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
            resolve(res.tempFilePath)
            return
          }

          reject(new Error(`图片下载失败：${res.statusCode}`))
        },
        fail: reject,
      })
    })
  },

  formatError(error, fallback) {
    const message = error && (error.message || error.errMsg)
    if (!message) return fallback
    return `${fallback}：${message}`
  },
})
