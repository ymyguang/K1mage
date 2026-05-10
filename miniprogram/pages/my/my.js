const { loginWithUserProfile, fetchCurrentUser, getStoredUser, clearSession } = require('../../utils/auth')

function getDisplayName(user) {
  return user && user.nickname ? user.nickname : 'K1mage 用户'
}

Page({
  data: {
    user: null,
    isLoading: true,
    isLoggingIn: false,
    errorMessage: '',
  },

  onShow() {
    this.syncTabBar()
    this.loadUser()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  async loadUser() {
    this.setData({
      user: getStoredUser(),
      isLoading: true,
      errorMessage: '',
    })

    const user = await fetchCurrentUser()
    getApp().globalData.user = user
    this.setData({
      user: user ? { ...user, displayName: getDisplayName(user) } : null,
      isLoading: false,
    })
  },

  async handleLogin() {
    this.setData({ isLoggingIn: true, errorMessage: '' })

    try {
      const user = await loginWithUserProfile()
      getApp().globalData.user = user
      this.setData({
        user: { ...user, displayName: getDisplayName(user) },
      })
      wx.showToast({ title: '登录成功' })
    } catch (error) {
      this.setData({ errorMessage: this.formatError(error, '登录失败') })
    } finally {
      this.setData({ isLoggingIn: false })
    }
  },

  openHistory() {
    wx.navigateTo({
      url: '/pages/history/history',
    })
  },

  handleLogout() {
    clearSession()
    getApp().globalData.user = null
    this.setData({ user: null })
    wx.showToast({ title: '已退出' })
  },

  formatError(error, fallback) {
    const message = error && (error.message || error.errMsg)
    if (!message) return fallback
    return `${fallback}：${message}`
  },
})
