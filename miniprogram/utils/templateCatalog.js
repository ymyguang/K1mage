const API_BASE_URL = 'http://localhost:3001'

const LOCAL_PREVIEW_ASSETS = {
  figurine: '/assets/templates/figurine.jpg',
  cosplay: '/assets/templates/cosplay.jpg',
}

const FALLBACK_TEMPLATES = [
  {
    id: 'figurine',
    name: '手办化',
    description: '将照片转化为3D手办效果，包含包装盒和展示底座',
    max_images: 1,
    point_cost: 1,
    order: 90,
    tags: ['3d', 'figure', 'collectible'],
    price: { price_per_image: 0, currency: 'CNY' },
  },
  {
    id: 'cosplay',
    name: 'Cosplay',
    description: '将插画角色转化为真实Cosplay照片',
    max_images: 1,
    point_cost: 1,
    order: 80,
    tags: ['cosplay', 'anime', 'illustration'],
    price: { price_per_image: 0, currency: 'CNY' },
  },
]

function normalizeTemplates(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload && payload.templates)) return payload.templates
  if (Array.isArray(payload && payload.data)) return payload.data
  return []
}

function request({ url, method = 'GET', data, skipAuth = false }) {
  return new Promise((resolve, reject) => {
    const header = {
      'content-type': 'application/json',
    }
    const token = wx.getStorageSync('k1mage_token')

    if (token && !skipAuth) {
      header.Authorization = `Bearer ${token}`
    }

    wx.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      timeout: 360000,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        const message = (res.data && (res.data.error || res.data.message)) || `请求失败：${res.statusCode}`
        const error = new Error(message)
        error.statusCode = res.statusCode
        error.response = res.data
        if (res.data && res.data.generationRecordId) {
          error.generationRecordId = res.data.generationRecordId
        }
        reject(error)
      },
      fail: reject,
    })
  })
}

function getTemplateId(template) {
  return template.id || template.slug || ''
}

function resolveApiAssetUrl(value) {
  if (!value) return ''
  return String(value).startsWith('http') ? value : `${API_BASE_URL}${value}`
}

function resolvePreviewSrc(template) {
  const id = getTemplateId(template)
  return resolveApiAssetUrl(template.preview_url) || LOCAL_PREVIEW_ASSETS[id] || ''
}

function resolveCoverSrc(template) {
  const id = getTemplateId(template)
  return resolveApiAssetUrl(template.cover_url) || resolveApiAssetUrl(template.preview_url) || LOCAL_PREVIEW_ASSETS[id] || ''
}

function formatPrice(template) {
  const points = Number(template && (template.point_cost || (template.price && template.price.points_per_image)))
  if (Number.isFinite(points) && points > 0) {
    return `${points} 积分/次`
  }

  const price = template && template.price
  if (!price || Number(price.price_per_image || 0) <= 0) {
    return '免费体验'
  }

  const currency = price.currency === 'CNY' ? '¥' : `${price.currency || ''} `
  return `${currency}${price.price_per_image}/张`
}

function toTemplateViewModel(template, index = 0) {
  const id = getTemplateId(template)

  return {
    ...template,
    id,
    alias: Array.isArray(template.alias) ? template.alias : [],
    tags: Array.isArray(template.tags) ? template.tags : [],
    previewSrc: resolvePreviewSrc(template),
    coverSrc: resolveCoverSrc(template),
    remotePreviewSrc: resolveApiAssetUrl(template.preview_url),
    remoteCoverSrc: resolveApiAssetUrl(template.cover_url),
    localPreviewSrc: LOCAL_PREVIEW_ASSETS[id] || '',
    maxImages: Number(template.max_images || template.maxImages || 1),
    isCustom: Boolean(template.is_custom || template.isCustom),
    isFeatured: Boolean(template.is_featured || template.isFeatured),
    isActive: template.is_active !== false,
    pointCost: Number(template.point_cost || 0),
    priceLabel: formatPrice(template),
    indexLabel: String(index + 1).padStart(2, '0'),
  }
}

async function loadTemplateCatalog(options = {}) {
  const sort = options.sort || 'order'
  try {
    const payload = await request({ url: `/api/templates?sort=${encodeURIComponent(sort)}` })
    return normalizeTemplates(payload).map(toTemplateViewModel)
  } catch (error) {
    return FALLBACK_TEMPLATES.map(toTemplateViewModel)
  }
}

module.exports = {
  API_BASE_URL,
  request,
  loadTemplateCatalog,
  normalizeTemplates,
  toTemplateViewModel,
}
