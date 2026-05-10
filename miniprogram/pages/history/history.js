const { request } = require('../../utils/templateCatalog')
const { ensureLoggedIn, fetchCurrentUser, getStoredUser } = require('../../utils/auth')

function getHistoryRecordCacheKey(recordId) {
  return `k1mage_history_record_${recordId}`
}

function formatStatus(status) {
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  return '处理中'
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function writeBase64ImageToFile(imageUrl, recordId) {
  const match = String(imageUrl).match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) {
    return Promise.resolve('')
  }

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const filePath = `${wx.env.USER_DATA_PATH}/k1mage-history-${recordId || Date.now()}.${ext}`

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

function downloadImageToTempFile(imageUrl) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: imageUrl,
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
}

async function resolveRecordImage(record) {
  if (!record.output_url || record.status !== 'success') {
    return ''
  }

  const outputUrl = String(record.output_url)
  if (outputUrl.startsWith('data:image/')) {
    return writeBase64ImageToFile(outputUrl, record.id)
  }

  if (outputUrl.startsWith('http')) {
    return downloadImageToTempFile(outputUrl)
  }

  return outputUrl
}

Page({
  data: {
    user: null,
    records: [],
    isLoading: true,
    errorMessage: '',
  },

  onShow() {
    this.loadPage()
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

  async loadPage() {
    this.setData({
      user: getStoredUser(),
      isLoading: true,
      errorMessage: '',
    })

    try {
      const user = await ensureLoggedIn()
      getApp().globalData.user = user
      this.setData({ user })
      await this.loadRecords()
      await this.refreshUser()
    } catch (error) {
      this.setData({ errorMessage: this.formatError(error, '记录加载失败') })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  async refreshUser() {
    const user = await fetchCurrentUser()
    getApp().globalData.user = user
    this.setData({ user })
  },

  async loadRecords() {
    const payload = await request({
      url: '/api/users/me/generation-records?limit=50',
    })

    const records = await Promise.all((payload.records || []).map(async (record) => {
      let displayUrl = ''

      try {
        displayUrl = await resolveRecordImage(record)
      } catch (error) {
        displayUrl = ''
      }

      return {
        ...record,
        displayUrl,
        statusLabel: formatStatus(record.status),
        timeLabel: formatTime(record.created_at),
      }
    }))

    records.forEach((record) => {
      wx.setStorageSync(getHistoryRecordCacheKey(record.id), record)
    })

    this.setData({ records })
  },

  openRecordDetail(event) {
    const { id } = event.currentTarget.dataset
    const record = this.data.records.find((item) => String(item.id) === String(id))
    if (!record) return

    wx.setStorageSync(getHistoryRecordCacheKey(record.id), record)
    wx.navigateTo({
      url: `/pages/create/create?id=${encodeURIComponent(record.template_id || '')}&mode=history&recordId=${record.id}`,
    })
  },

  previewRecord(event) {
    const { url } = event.currentTarget.dataset
    if (!url) return

    wx.previewImage({
      urls: [url],
      current: url,
    })
  },

  formatError(error, fallback) {
    const message = error && (error.message || error.errMsg)
    if (!message) return fallback
    return `${fallback}：${message}`
  },
})
