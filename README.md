<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# K1mage - 多模型统一AI图像生成平台

支持多个AI模型提供商的统一图像生成平台，包括Google Gemini、OpenAI（GPT Image 2、DALL-E）和阿里巴巴通义万相。

## 项目结构

```
K1mage/
├── api-server/          # 后端API服务器（多模型统一调用）
├── miniprogram/         # 小程序版本（UniApp + Vue 3）
├── services/            # Web版前端服务
├── components/          # Web版React组件
├── constants.ts         # Web版常量配置
└── App.tsx              # Web版主应用
```

## 支持的模型

| 提供商 | 模型 | 说明 |
|--------|------|------|
| Google Gemini | gemini-2.5-flash-image | 快速图像生成 |
| Google Gemini | gemini-3-pro-image-preview | 高质量图像生成 |
| **OpenAI** | **gpt-image-2** | **GPT Image 2 最新模型** |
| OpenAI | dall-e-3 | DALL-E 3 |
| OpenAI | dall-e-2 | DALL-E 2（支持编辑） |
| 通义万相 | wanx-v2.6 | 通义万相增强版 |
| 通义万相 | wanx-v1 | 通义万相基础版 |

## 快速开始

### 1. 启动后端API服务器

```bash
cd api-server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的API密钥

# 启动服务
npm run dev
```

### 2. 启动Web版本

```bash
# 安装依赖
npm install

# 配置环境变量
# 创建 .env.local 文件，填入 GEMINI_API_KEY（可选，现在通过后端管理）

# 启动开发服务器
npm run dev
```

### 3. 启动小程序版本

```bash
cd miniprogram

# 安装依赖
npm install

# 微信小程序开发
npm run dev:mp-weixin

# H5开发
npm run dev:h5
```

## 环境变量配置

### 后端服务器 (api-server/.env)

```env
PORT=3001
NODE_ENV=development

# Google Gemini
GEMINI_API_KEY=your_gemini_key

# OpenAI (支持 GPT Image 2 和 DALL-E)
OPENAI_API_KEY=your_openai_key

# 阿里巴巴通义万相
TONGYI_API_KEY=your_tongyi_key

# 默认模型
DEFAULT_PROVIDER=gemini
DEFAULT_MODEL=gemini-2.5-flash-image
```

### Web版本 (.env.local)

```env
# API服务器地址（可选，默认 http://localhost:3001）
VITE_API_SERVER_URL=http://localhost:3001
```

### 小程序版本 (miniprogram/.env)

```env
# API服务器地址
VITE_API_BASE_URL=http://localhost:3001
```

## API接口

### 生成图像

```http
POST /api/image/generate
Content-Type: application/json

{
  "model": "openai/gpt-image-2",
  "prompt": "A beautiful sunset over the ocean",
  "aspectRatio": "1:1"
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
  ]
}
```

### 获取可用模型

```http
GET /api/image/models
```

## 扩展新模型

架构支持快速扩展新的模型提供商，只需3步：

1. 创建适配器 `api-server/adapters/newprovider.js`
2. 添加配置 `api-server/config/providers.js`
3. 注册适配器 `api-server/adapters/factory.js`

详细说明请查看 [api-server/README.md](./api-server/README.md)

## 运行测试

```bash
# 后端测试
cd api-server
npm test

# 前端测试
npm test
```

## 技术栈

### Web版本
- React 19
- TypeScript
- Vite

### 小程序版本
- UniApp
- Vue 3
- TypeScript

### 后端
- Express.js
- Node.js

## 许可证

MIT
