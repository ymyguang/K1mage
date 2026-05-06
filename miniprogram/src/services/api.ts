import type { GeneratedContent, ImagePart } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

interface ApiResponse {
  success: boolean;
  imageUrl?: string;
  text?: string;
  error?: string;
}

/**
 * 编辑图像
 * @param prompt 提示词
 * @param imageParts 图片部分数组
 * @param model 模型名称
 * @param options 选项（蒙版等）
 * @returns 生成内容
 */
export async function editImage(
  prompt: string,
  imageParts: ImagePart[],
  model: string = 'gemini/gemini-2.5-flash-image',
  options: { mask?: string } = {}
): Promise<GeneratedContent> {
  try {
    const images = imageParts.map(part => ({
      base64: part.base64,
      mimeType: part.mimeType
    }));

    // @ts-ignore - uni is global in uni-app environment
    const response = await uni.request({
      url: `${API_BASE_URL}/api/image/edit`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2分钟超时
      data: {
        prompt,
        model,
        images,
        mask: options.mask || null,
      },
    });

    const data = response.data as ApiResponse;
    
    if (response.statusCode === 200 && data.success) {
      return {
        imageUrl: data.imageUrl || null,
        text: data.text || null
      };
    } else {
      throw new Error(data.error || 'Failed to edit image');
    }
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
}

/**
 * 从文本生成图像
 * @param prompt 提示词
 * @param model 模型名称
 * @param options 选项（宽高比等）
 * @returns 生成内容
 */
export async function generateImage(
  prompt: string,
  model: string = 'gemini/gemini-2.5-flash-image',
  options: { aspectRatio?: string } = {}
): Promise<GeneratedContent> {
  try {
    // @ts-ignore - uni is global in uni-app environment
    const response = await uni.request({
      url: `${API_BASE_URL}/api/image/generate`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2分钟超时
      data: {
        prompt,
        model,
        aspectRatio: options.aspectRatio || '1:1',
      },
    });

    const data = response.data as ApiResponse;
    
    if (response.statusCode === 200 && data.success) {
      return {
        imageUrl: data.imageUrl || null,
        text: data.text || null
      };
    } else {
      throw new Error(data.error || 'Failed to generate image');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * 批量生成图像变体
 * @param prompt 提示词
 * @param imageParts 图片部分数组
 * @param model 模型名称
 * @param count 生成数量
 * @returns 图像 URL 数组
 */
export async function generateImageBatch(
  prompt: string,
  imageParts: ImagePart[],
  model: string = 'gemini/gemini-2.5-flash-image',
  count: number = 4
): Promise<string[]> {
  try {
    const promises = Array(count).fill(null).map(() => 
      editImage(prompt, imageParts, model)
    );
    
    const results = await Promise.all(promises);
    const imageUrls = results
      .filter(r => r.imageUrl)
      .map(r => r.imageUrl as string);
    
    if (imageUrls.length === 0) {
      throw new Error('Failed to generate any image variations');
    }
    
    return imageUrls;
  } catch (error) {
    console.error('Error generating image batch:', error);
    throw error;
  }
}

/**
 * 生成视频
 * @param prompt 提示词
 * @param image 参考图片（可选）
 * @param aspectRatio 宽高比
 * @param onProgress 进度回调
 * @returns 视频 URL
 */
export async function generateVideo(
  prompt: string,
  image: { base64: string; mimeType: string } | null = null,
  aspectRatio: '16:9' | '9:16' = '16:9',
  onProgress?: (message: string) => void
): Promise<string> {
  try {
    if (onProgress) {
      onProgress('正在初始化视频生成...');
    }

    // @ts-ignore - uni is global in uni-app environment
    const response = await uni.request({
      url: `${API_BASE_URL}/api/video/generate`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      timeout: 600000, // 10分钟超时（视频生成需要更长时间）
      data: {
        prompt,
        image,
        aspectRatio,
      },
    });

    const data = response.data as { success: boolean; videoUrl?: string; error?: string };
    
    if (response.statusCode === 200 && data.success && data.videoUrl) {
      return data.videoUrl;
    } else {
      throw new Error(data.error || 'Failed to generate video');
    }
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

/**
 * 下载视频到本地
 * @param url 视频 URL
 * @returns 临时文件路径
 */
export function downloadVideo(url: string): Promise<string> {
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
        console.error('Download video failed:', err)
        reject(err)
      }
    })
  })
}

/**
 * 保存视频到相册
 * @param filePath 临时文件路径
 * @returns 是否成功
 */
export function saveVideoToAlbum(filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    uni.saveVideoToPhotosAlbum({
      filePath,
      success: () => {
        uni.showToast({
          title: '已保存到相册',
          icon: 'success'
        })
        resolve(true)
      },
      fail: (err) => {
        console.error('Save video failed:', err)
        if (err.errMsg.includes('deny') || err.errMsg.includes('denied')) {
          uni.showModal({
            title: '提示',
            content: '需要您授权保存视频到相册',
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
 * 获取可用模型列表
 * @returns 模型列表
 */
export async function getAvailableModels(): Promise<Array<{ id: string; name: string; provider: string }>> {
  try {
    // @ts-ignore - uni is global in uni-app environment
    const response = await uni.request({
      url: `${API_BASE_URL}/api/image/models`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
      },
    });

    if (response.statusCode === 200 && response.data.success) {
      return response.data.models || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

/**
 * 健康检查
 * @returns 服务器状态
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // @ts-ignore - uni is global in uni-app environment
    const response = await uni.request({
      url: `${API_BASE_URL}/health`,
      method: 'GET',
      timeout: 5000, // 5秒超时
    });

    return response.statusCode === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
