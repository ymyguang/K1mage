const { request } = require('./templateCatalog')

const TOKEN_KEY = 'k1mage_token'
const USER_KEY = 'k1mage_user'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function getStoredUser() {
  return wx.getStorageSync(USER_KEY) || null
}

function setSession({ token, user }) {
  if (token) {
    wx.setStorageSync(TOKEN_KEY, token)
  }

  if (user) {
    wx.setStorageSync(USER_KEY, user)
  }
}

function clearSession() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: ({ code }) => {
        if (code) {
          resolve(code)
          return
        }

        reject(new Error('微信登录失败，请稍后重试'))
      },
      fail: reject,
    })
  })
}

function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示头像和昵称',
      success: ({ userInfo }) => resolve(userInfo || {}),
      fail: reject,
    })
  })
}

async function login(profile = {}) {
  const code = await wxLogin()
  const payload = await request({
    url: '/api/auth/wechat-login',
    method: 'POST',
    data: {
      code,
      nickname: profile.nickname || profile.nickName || '',
      avatarUrl: profile.avatarUrl || '',
    },
    skipAuth: true,
  })

  setSession(payload)
  return payload.user
}

async function loginWithUserProfile() {
  const profile = await getUserProfile()
  return login(profile)
}

async function fetchCurrentUser() {
  if (!getToken()) return null

  try {
    const payload = await request({ url: '/api/auth/me' })
    setSession({ user: payload.user })
    return payload.user
  } catch (error) {
    clearSession()
    return null
  }
}

async function ensureLoggedIn() {
  const token = getToken()
  if (token) {
    const user = await fetchCurrentUser()
    if (user) return user
  }

  return login()
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  getStoredUser,
  setSession,
  clearSession,
  login,
  loginWithUserProfile,
  fetchCurrentUser,
  ensureLoggedIn,
}
