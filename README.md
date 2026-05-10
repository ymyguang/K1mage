# K1mage 项目架构文档

## 1. 项目概述

**K1mage** 当前由两个主要部分组成：

- `miniprogram/`：微信小程序前端
- `api-server/`：Node.js + Express 后端

系统目标是提供一个面向微信小程序的 AI 图像生成平台。后端通过统一适配器架构接入多个图像模型提供商，前端负责模板展示、微信登录、图片上传、结果展示和历史记录查看。

当前文档只描述 **小程序** 和 **后端**。

---

## 2. 整体架构

```text
┌──────────────────────────────────────────────┐
│                微信小程序端                  │
│                miniprogram/                  │
├──────────────────────────────────────────────┤
│ pages/index     模板首页                     │
│ pages/create    创建与生成页                 │
│ pages/history   生成历史页                   │
│ pages/my        我的页面                     │
│ utils/auth.js   登录态与微信登录             │
│ utils/templateCatalog.js  API 请求与模板目录 │
└──────────────────────────┬───────────────────┘
                           │ HTTP JSON API
                           ▼
┌──────────────────────────────────────────────┐
│                 API Server                   │
│                 api-server/                  │
├──────────────────────────────────────────────┤
│ server.js        Express 入口                │
│ routes/          API 路由层                  │
│ middleware/      JWT 鉴权                    │
│ services/        用户、积分、记录服务        │
│ adapters/        多模型适配器                │
│ config/          Provider / Model 配置       │
│ template-manager.js  模板资源加载            │
│ db/              MySQL 连接与表结构          │
└───────────────┬───────────────┬──────────────┘
                │               │
                ▼               ▼
         MySQL 业务数据      多家图像模型提供商
                            Gemini / OpenAI / 通义
```

---

## 3. 小程序架构

### 3.1 技术形态

当前 `miniprogram/` 是 **微信原生小程序工程**，不是 UniApp，也不是 Vue 工程。

关键配置见：

- [app.json](/Users/ymyguang/Code/K1mage/miniprogram/app.json)
- [project.config.json](/Users/ymyguang/Code/K1mage/miniprogram/project.config.json)

当前特征：

- 原生页面结构：`.js + .json + .wxml + .wxss`
- 自定义 `tabBar`
- 使用 `skyline` 渲染器和 `glass-easel`
- 通过 `wx.request` 直接请求后端 API

### 3.2 目录结构

```text
miniprogram/
├── app.js
├── app.json
├── app.wxss
├── project.config.json
├── project.private.config.json
├── sitemap.json
├── pages/
│   ├── index/      首页，模板浏览入口
│   ├── create/     创建页，发起图像生成
│   ├── history/    历史记录页
│   └── my/         用户与积分信息
├── components/
│   └── navigation-bar/
├── custom-tab-bar/
├── utils/
│   ├── auth.js
│   └── templateCatalog.js
└── assets/
    ├── brand/
    └── templates/
```

### 3.3 页面职责

- `pages/index/index`：拉取模板列表，展示模板封面、价格、标签等信息
- `pages/create/create`：选择模板、上传图片、提交生成请求、保存结果图
- `pages/history/history`：读取当前用户的生成记录
- `pages/my/my`：展示登录用户、积分等状态

### 3.4 小程序请求层

[utils/templateCatalog.js](/Users/ymyguang/Code/K1mage/miniprogram/utils/templateCatalog.js) 是当前小程序侧的统一请求与模板目录入口，负责：

- 定义 API 基础地址 `API_BASE_URL`
- 封装 `request(...)`
- 自动附带 `Authorization: Bearer <token>`
- 拉取模板目录并转换成小程序 UI 需要的 view model
- 在接口失败时回退到本地模板数据

[utils/auth.js](/Users/ymyguang/Code/K1mage/miniprogram/utils/auth.js) 负责：

- 调用 `wx.login`
- 发起 `/api/auth/wechat-login`
- 存储 token 与用户信息
- 拉取 `/api/auth/me`
- 保证需要鉴权的页面请求前具备有效登录态

### 3.5 小程序与后端交互

当前已确认的小程序主调用链：

- 模板列表：`GET /api/templates`
- 微信登录：`POST /api/auth/wechat-login`
- 当前用户：`GET /api/auth/me`
- 发起生成：`POST /api/image/generate`
- 用户历史：`GET /api/users/me/generation-records`

---

## 4. 后端架构

### 4.1 技术栈

- Runtime：Node.js ES Modules
- Framework：Express 4
- Database：MySQL 8 + `mysql2`
- Auth：JWT
- Config：`dotenv`
- Upload / body handling：JSON / base64 图片输入
- Testing：Jest + Supertest

### 4.2 目录结构

```text
api-server/
├── server.js
├── package.json
├── .env
├── .env.example
├── docker-compose.mysql.yml
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── admin.js
│   ├── templates.js
│   └── image.js
├── middleware/
│   └── auth.js
├── services/
│   ├── auth-service.js
│   ├── generation-service.js
│   └── point-service.js
├── adapters/
│   ├── base.js
│   ├── factory.js
│   ├── gemini.js
│   ├── openai.js
│   ├── tongyi.js
│   ├── mock.js
│   └── index.js
├── config/
│   ├── index.js
│   ├── models.js
│   └── providers.js
├── db/
│   ├── pool.js
│   └── schema.sql
├── prompts/
│   └── <template-id>/
│       ├── meta.json
│       ├── prompt.txt
│       ├── price.json
│       ├── preview.png
│       └── cover.png
├── scripts/
│   ├── init-db.js
│   ├── start-local-mysql.ps1
│   └── test_openai_image_api.py
└── tests/
    ├── smoke/
    ├── unit/
    └── mocks/
```

### 4.3 服务入口

[server.js](/Users/ymyguang/Code/K1mage/api-server/server.js) 负责：

- 读取环境变量
- 创建 Express 应用
- 注册 JSON / URL encoded 中间件
- 挂载 API 路由
- 在启动时执行 `templateManager.loadAll()`

当前后端不再保留独立的 legacy Gemini 路由，统一使用 `/api/image/*` 作为图像生成入口。

---

## 5. 后端分层

### 5.1 路由层

当前路由：

- [routes/auth.js](/Users/ymyguang/Code/K1mage/api-server/routes/auth.js)
- [routes/users.js](/Users/ymyguang/Code/K1mage/api-server/routes/users.js)
- [routes/admin.js](/Users/ymyguang/Code/K1mage/api-server/routes/admin.js)
- [routes/templates.js](/Users/ymyguang/Code/K1mage/api-server/routes/templates.js)
- [routes/image.js](/Users/ymyguang/Code/K1mage/api-server/routes/image.js)

职责划分：

- `auth.js`：微信登录、JWT 发放、当前用户信息
- `users.js`：当前用户信息、积分、生成记录
- `admin.js`：用户列表、用户状态、积分调整、全局生成记录
- `templates.js`：模板目录、模板详情、模板图片资源、点击计数
- `image.js`：统一图像生成/编辑入口、鉴权、积分扣减、生成记录写入、模型调用

### 5.2 中间件层

[middleware/auth.js](/Users/ymyguang/Code/K1mage/api-server/middleware/auth.js) 提供：

- `getUserFromRequest(req)`：从 Bearer Token 解析用户
- `requireAuth`：要求登录
- `requireAdmin`：要求管理员权限

### 5.3 服务层

- [services/auth-service.js](/Users/ymyguang/Code/K1mage/api-server/services/auth-service.js)
  - 微信 `code -> session`
  - 用户创建 / 更新
  - JWT 签发与校验
- [services/point-service.js](/Users/ymyguang/Code/K1mage/api-server/services/point-service.js)
  - 积分授予、扣减、退款、管理员调整
- [services/generation-service.js](/Users/ymyguang/Code/K1mage/api-server/services/generation-service.js)
  - 生成记录创建、成功/失败标记、历史查询

### 5.4 模板资源层

[template-manager.js](/Users/ymyguang/Code/K1mage/api-server/template-manager.js) 是模板中心，负责：

- 从 `api-server/prompts/<template-id>/` 目录加载模板
- 读取 `meta.json`、`prompt.txt`、`price.json`
- 生成 `preview_url` 和 `cover_url`
- 提供模板查询与点击量更新能力

这里的 `prompts/` 不是模型提示词草稿目录，而是当前业务运行时模板资源库。

---

## 6. 图像生成架构

### 6.1 统一入口

当前统一图像生成入口是：

- `POST /api/image/generate`
- `POST /api/image/edit`
- `GET /api/image/models`
- `GET /api/image/providers`

图像能力统一收口在 [routes/image.js](/Users/ymyguang/Code/K1mage/api-server/routes/image.js)。

### 6.2 处理流程

`POST /api/image/generate` 的主流程：

1. 校验 `model`
2. 根据 `templateId` 读取模板
3. 解析 `customPrompt` 或模板 prompt
4. 校验图片数量与图片格式
5. 解析当前登录用户
6. 根据模板或默认配置计算积分成本
7. 创建生成记录并扣减积分
8. 通过 adapter factory 调用指定 provider/model
9. 成功时写入结果图 URL
10. 失败时标记记录并执行积分退款

这条链路把“模板、鉴权、积分、生成记录、模型调用”合并在一个统一业务入口中。

### 6.3 适配器模式

`api-server/adapters/` 使用适配器模式统一不同模型供应商：

- `gemini.js`
- `openai.js`
- `tongyi.js`
- `mock.js`

统一职责：

- 校验请求参数
- 将统一请求结构转换为 provider 原生请求
- 解析 provider 返回结果
- 将结果标准化为统一响应格式

这使小程序不需要感知不同模型 API 的差异，只传统一的 `model` 与输入参数即可。

### 6.4 Mock 模式

当启用 `ENABLE_IMAGE_MOCK=true` 或 `ENABLE_MOCK=true` 时，后端可跳过真实模型调用，返回模板 preview 图作为 mock 结果，同时仍然保留：

- 鉴权
- 积分逻辑
- 生成记录

这用于低成本联调小程序完整业务链路。

---

## 7. 模板与资源结构

后端模板目录的单个模板结构如下：

```text
api-server/prompts/<template-id>/
├── meta.json      # 名称、描述、标签、排序、开关等元数据
├── prompt.txt     # 实际生成 prompt
├── price.json     # 价格或积分配置
├── preview.png    # 列表预览图
└── cover.png      # 详情封面图（可选）
```

小程序通过 `/api/templates` 获取模板元数据，通过 `/api/templates/:id/preview` 和 `/api/templates/:id/cover` 获取远程图片资源。

---

## 8. 认证、积分与记录

### 8.1 认证

认证链路：

1. 小程序调用 `wx.login`
2. 小程序把 `code` 提交到 `POST /api/auth/wechat-login`
3. 后端向微信接口换取 `openid / unionid`
4. 后端创建或更新用户
5. 后端签发 JWT
6. 小程序后续请求通过 `Authorization: Bearer <token>` 访问需要鉴权的接口

### 8.2 积分

积分逻辑集中在 `point-service.js`：

- 新用户注册奖励
- 图像生成扣减
- 失败退款
- 管理员手动加减积分

模板返回中包含 `point_cost`，小程序可直接展示用户本次生成所需积分。

### 8.3 生成记录

生成记录由 `generation-service.js` 维护，核心字段包括：

- 用户 ID
- 模板 ID
- 模型名
- prompt
- 输入图数量
- 输出图 URL
- 状态
- 消耗积分
- 错误信息

小程序历史页通过 `/api/users/me/generation-records` 拉取当前用户历史。

---

## 9. 当前核心 API

### 9.1 公开或基础接口

- `GET /health`
- `GET /api/templates`
- `GET /api/templates/:id`
- `GET /api/templates/:id/preview`
- `GET /api/templates/:id/cover`

### 9.2 鉴权接口

- `POST /api/auth/wechat-login`
- `GET /api/auth/me`

### 9.3 用户接口

- `GET /api/users/me`
- `GET /api/users/me/points`
- `GET /api/users/me/generation-records`

### 9.4 图像接口

- `GET /api/image/models`
- `GET /api/image/providers`
- `POST /api/image/generate`
- `POST /api/image/edit`

### 9.5 管理接口

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `POST /api/admin/users/:id/points`
- `GET /api/admin/generation-records`

---

## 10. 开发与运行说明

### 10.1 小程序

- 开发根目录：`miniprogram/`
- 使用微信开发者工具打开该目录
- 当前 API 地址写在 `utils/templateCatalog.js` 的 `API_BASE_URL`

### 10.2 后端

- 服务入口：`api-server/server.js`
- 默认端口：`3001`
- 初始化数据库：`npm run db:init`
- 启动开发服务：`npm run dev`
- 测试：`npm test`

### 10.3 运行依赖

后端运行依赖：

- MySQL
- 微信登录配置
- 至少一个图像 provider 的 API key

---

## 11. 当前架构结论

K1mage 当前是一个 **微信小程序 + Express API Server + MySQL + 多模型适配器** 的架构。

它的关键特点是：

- 小程序前端使用微信原生工程
- 后端以 `/api/image` 为统一图像生成入口
- 模板、积分、用户、记录都已经进入后端主业务链
- Gemini、OpenAI、通义等模型通过统一 adapter 层接入
- 历史兼容入口不属于当前主架构描述范围
