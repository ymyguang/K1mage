# K1mage Multi-Model API Server

多模型统一调用平台后端服务

## 支持的模型提供商

| 提供商 | 模型 | 说明 |
|--------|------|------|
| Google Gemini | gemini-2.5-flash-image | 快速图像生成 |
| Google Gemini | gemini-3-pro-image-preview | 高质量图像生成 |
| OpenAI | gpt-image-2 | GPT Image 2 最新模型 |
| OpenAI | dall-e-3 | DALL-E 3 |
| OpenAI | dall-e-2 | DALL-E 2 (支持编辑) |
| 通义万相 | wanx-v2.6 | 通义万相增强版 |
| 通义万相 | wanx-v1 | 通义万相基础版 |

## 快速开始

### 1. 安装依赖

```bash
cd api-server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Google Gemini
GEMINI_API_KEY=your_gemini_key_here

# OpenAI (支持 DALL-E 和 GPT Image 2)
OPENAI_API_KEY=your_openai_key_here

# 阿里巴巴通义万相
TONGYI_API_KEY=your_tongyi_key_here
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API 接口

### 生成图像

```http
POST /api/image/generate
Content-Type: application/json

{
  "model": "openai/gpt-image-2",
  "prompt": "A beautiful sunset over the ocean",
  "aspectRatio": "1:1",
  "quality": "auto"
}
```

### 编辑图像

```http
POST /api/image/edit
Content-Type: application/json

{
  "model": "gemini/gemini-2.5-flash-image",
  "prompt": "Add sunglasses to the person",
  "images": [
    {
      "base64": "base64_encoded_image...",
      "mimeType": "image/png"
    }
  ],
  "mask": "base64_encoded_mask..."
}
```

### 获取可用模型

```http
GET /api/image/models
```

### 获取提供商信息

```http
GET /api/image/providers
```

## 扩展新模型提供商

架构设计支持快速扩展新的模型提供商。只需以下步骤：

### 步骤 1: 创建适配器

在 `adapters/` 目录下创建新文件，例如 `adapters/newprovider.js`：

```javascript
import { BaseAdapter } from './base.js';

export class NewProviderAdapter extends BaseAdapter {
  constructor(providerConfig) {
    super(providerConfig);
  }

  async generateImage(request) {
    const startTime = Date.now();
    
    try {
      const modelConfig = this.validateRequest(request);
      
      // 实现你的API调用逻辑
      const response = await fetch(`${this.baseUrl}/your-api-endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          // ... 其他参数
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      
      // 处理响应，返回统一格式
      const imageUrl = data.image_url; // 或 base64
      
      return this.createSuccessResponse(imageUrl, null, {
        model: request.model,
        processingTime: Date.now() - startTime
      });
    } catch (error) {
      return this.createErrorResponse(
        this.handleError(error, 'generateImage'),
        { processingTime: Date.now() - startTime }
      );
    }
  }

  async editImage(request) {
    // 实现图像编辑逻辑（如果支持）
    throw new Error('Image editing not supported for this provider');
  }

  handleError(error, context) {
    // 自定义错误处理
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        return new Error('Invalid API key');
      }
      if (status === 429) {
        return new Error('Rate limit exceeded');
      }
    }
    return super.handleError(error, context);
  }
}
```

### 步骤 2: 添加配置

在 `config/providers.js` 中添加新提供商配置：

```javascript
export const PROVIDER_CONFIGS = {
  // ... 现有提供商
  
  newprovider: {
    name: 'New Provider',
    baseUrl: 'https://api.newprovider.com/v1',
    apiKey: process.env.NEWPROVIDER_API_KEY,
    enabled: !!process.env.NEWPROVIDER_API_KEY,
    models: [
      {
        id: 'model-v1',
        name: 'Model V1',
        maxImages: 1,
        supportsEditing: true,
        supportsAspectRatio: true
      }
    ]
  }
};
```

在 `config/models.js` 中添加模型配置：

```javascript
export const MODEL_CONFIGS = {
  // ... 现有提供商
  
  newprovider: {
    name: 'New Provider',
    provider: 'newprovider',
    models: [
      {
        id: 'model-v1',
        name: 'Model V1',
        description: 'Description of the model',
        badge: 'New'
      }
    ]
  }
};
```

### 步骤 3: 注册适配器

在 `adapters/factory.js` 中注册新适配器：

```javascript
import { NewProviderAdapter } from './newprovider.js';

class AdapterFactory {
  constructor() {
    this.adapterClasses = {
      // ... 现有适配器
      newprovider: NewProviderAdapter
    };
  }
}
```

### 步骤 4: 添加环境变量

在 `.env` 和 `.env.example` 中添加：

```env
NEWPROVIDER_API_KEY=your_key_here
```

### 步骤 5: 更新前端配置（可选）

在 `constants.ts` 中添加模型选项：

```typescript
export const MODELS = [
  // ... 现有模型
  { id: 'newprovider/model-v1', nameKey: 'app.models.newProviderModel', badge: 'New', provider: 'New Provider' },
];
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行冒烟测试
npm run test:smoke

# 运行单元测试
npm run test:unit

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 项目结构

```
api-server/
├── adapters/           # 模型适配器
│   ├── base.js        # 基类
│   ├── factory.js     # 工厂类
│   ├── gemini.js      # Google Gemini 适配器
│   ├── openai.js      # OpenAI 适配器
│   ├── tongyi.js      # 通义万相适配器
│   └── index.js       # 导出
├── config/            # 配置管理
│   ├── index.js       # 配置管理器
│   ├── providers.js   # 提供商配置
│   └── models.js      # 模型配置
├── routes/            # API 路由
│   ├── image.js       # 统一图像 API
│   └── gemini.js      # 旧版 Gemini API（兼容）
├── tests/             # 测试文件
│   ├── unit/          # 单元测试
│   ├── smoke/         # 冒烟测试
│   └── mocks/         # Mock 数据
├── .env               # 环境变量
├── .env.example       # 环境变量示例
├── server.js          # 服务器入口
└── package.json       # 项目配置
```

## GPT Image 2 特有参数

GPT Image 2 支持以下额外参数：

```json
{
  "model": "openai/gpt-image-2",
  "prompt": "A beautiful sunset",
  "quality": "auto",           // "low", "medium", "high", "auto"
  "background": "auto",        // "transparent", "opaque", "auto"
  "output_format": "png",      // "png", "jpeg", "webp"
  "output_compression": 100,   // 0-100, 仅对 jpeg/webp 有效
  "aspectRatio": "1:1"         // "1:1", "1536x1024", "1024x1536", "auto"
}
```

## 许可证

MIT
