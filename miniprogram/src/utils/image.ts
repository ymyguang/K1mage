/**
 * 图片处理工具函数 - 适配小程序 API
 */

/**
 * 选择图片
 * @param count 图片数量
 * @param sizeType 图片尺寸
 * @param sourceType 图片来源
 * @returns 临时文件路径数组
 */
export const chooseImage = (
  count: number = 1,
  sizeType: ('original' | 'compressed')[] = ['compressed', 'original'],
  sourceType: ('album' | 'camera')[] = ['album', 'camera']
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType,
      sourceType,
      success: (res) => {
        resolve(res.tempFilePaths)
      },
      fail: (err) => {
        console.error('Choose image failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 图片转 Base64
 * @param filePath 临时文件路径
 * @returns data URL 格式的 base64 字符串
 */
export const imageToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        // 获取图片类型
        const ext = filePath.split('.').pop()?.toLowerCase() || 'jpeg'
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
        resolve(`data:${mimeType};base64,${res.data}`)
      },
      fail: (err) => {
        console.error('Image to base64 failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 获取图片信息
 * @param src 图片路径或 URL
 * @returns 图片信息
 */
export const getImageInfo = (src: string): Promise<UniApp.GetImageInfoSuccessData> => {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        console.error('Get image info failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 保存图片到相册
 * @param filePath 临时文件路径
 * @returns 是否成功
 */
export const saveImageToAlbum = (filePath: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        uni.showToast({
          title: '已保存到相册',
          icon: 'success'
        })
        resolve(true)
      },
      fail: (err) => {
        console.error('Save image failed:', err)
        if (err.errMsg.includes('deny') || err.errMsg.includes('denied')) {
          uni.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                uni.openSetting()
              }
            }
          })
        } else {
          uni.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
        reject(err)
      }
    })
  })
}

/**
 * 下载网络图片
 * @param url 图片 URL
 * @returns 临时文件路径
 */
export const downloadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error(`Download failed with status ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('Download image failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 压缩图片
 * @param src 图片路径
 * @param quality 压缩质量 0-100
 * @returns 压缩后的临时文件路径
 */
export const compressImage = (src: string, quality: number = 80): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        console.error('Compress image failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 预览图片
 * @param urls 图片 URL 数组
 * @param current 当前显示的图片索引
 */
export const previewImage = (urls: string[], current: number = 0): void => {
  uni.previewImage({
    urls,
    current,
    fail: (err) => {
      console.error('Preview image failed:', err)
    }
  })
}

/**
 * 将 data URL 转换为临时文件
 * @param dataUrl data URL 字符串
 * @param filename 文件名
 * @returns 临时文件路径
 */
export const dataUrlToTempFile = async (dataUrl: string, filename: string = 'image.png'): Promise<string> => {
  // 从 data URL 提取 base64 数据
  const base64Data = dataUrl.split(',')[1]
  if (!base64Data) {
    throw new Error('Invalid data URL')
  }

  // 写入临时文件
  const fs = uni.getFileSystemManager()
  const tempPath = `${wx.env.USER_DATA_PATH}/${filename}`
  
  return new Promise((resolve, reject) => {
    fs.writeFile({
      filePath: tempPath,
      data: base64Data,
      encoding: 'base64',
      success: () => {
        resolve(tempPath)
      },
      fail: (err) => {
        console.error('Data URL to temp file failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 检查图片是否为 data URL
 * @param url 图片 URL
 * @returns 是否为 data URL
 */
export const isDataUrl = (url: string): boolean => {
  return url.startsWith('data:')
}

/**
 * 从 data URL 提取 MIME 类型
 * @param dataUrl data URL 字符串
 * @returns MIME 类型
 */
export const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  const match = dataUrl.match(/data:([^;]+);/)
  return match ? match[1] : 'image/png'
}

/**
 * 从 data URL 提取 base64 数据
 * @param dataUrl data URL 字符串
 * @returns base64 数据
 */
export const getBase64FromDataUrl = (dataUrl: string): string => {
  const parts = dataUrl.split(',')
  return parts.length > 1 ? parts[1] : ''
}
