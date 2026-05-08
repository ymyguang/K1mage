const { API_BASE_URL, loadTemplateCatalog } = require('../../utils/templateCatalog')
const { fetchCurrentUser, getStoredUser, loginWithUserProfile } = require('../../utils/auth')

Page({
  data: {
    apiBaseUrl: API_BASE_URL,
    templates: [],
    user: null,
    isLoggingIn: false,
    isLoadingUser: true,
    isLoadingTemplates: true,
    errorMessage: '',
  },

  onLoad() {
    this.loadTemplates()
  },

  onShow() {
    this.syncTabBar()
    this.refreshUser()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  async refreshUser() {
    this.setData({
      user: getStoredUser(),
      isLoadingUser: true,
    })

    const user = await fetchCurrentUser()
    getApp().globalData.user = user
    this.setData({
      user,
      isLoadingUser: false,
    })
  },

  async handleLogin() {
    this.setData({ isLoggingIn: true, errorMessage: '' })

    try {
      const user = await loginWithUserProfile()
      getApp().globalData.user = user
      this.setData({ user })
      wx.showToast({ title: '登录成功' })
    } catch (error) {
      this.setData({ errorMessage: this.formatError(error, '登录失败') })
    } finally {
      this.setData({ isLoggingIn: false })
    }
  },

  async loadTemplates() {
    this.setData({ isLoadingTemplates: true, errorMessage: '' })

    try {
      const templates = await loadTemplateCatalog({ sort: 'order' })
      this.setData({ templates })
    } catch (error) {
      this.setData({ errorMessage: this.formatError(error, '模板加载失败') })
    } finally {
      this.setData({ isLoadingTemplates: false })
    }
  },

  openTemplate(event) {
    const { id } = event.currentTarget.dataset
    if (!id) return
    wx.navigateTo({
      url: `/pages/create/create?id=${encodeURIComponent(id)}`,
    })
  },

  formatError(error, fallback) {
    const message = error && (error.message || error.errMsg)
    if (!message) return fallback
    return `${fallback}：${message}`
  },
})
