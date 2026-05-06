
当前系统基于 Google 的 Gemini 实现图片生成，但架构是单模型绑定。现在希望升级为一个多模型统一调用的图片生成平台：前端只负责输入提示词并展示结果，后端通过统一接口对接不同模型提供商（如 OpenAI 的图像生成 API、Alibaba 的通义万相 2.6 等），通过配置化方式管理各平台的 URL 和 API Key，并用适配层屏蔽不同接口差异，实现统一输入输出，从而支持灵活切换和扩展多种图像生成模型，而无需修改前端或业务逻辑。【已解决】

todo

1，
现在还是类emoji的效果 应该是prompt得到的具体效果图

2.后端支持prompt的可拓展，使用固定的结果，
txt （prompt）
image（效果图）
价格 （每张）
prompts/
├── style_001/                # 一个能力（一个prompt模板）
│   ├── prompt.txt            # Prompt内容（核心）
│   ├── preview.png           # 效果图（给用户看的）
│   ├── price.json            # 价格配置
│   ├── config.json           # 参数配置（可选）
│   └── meta.json             # 元信息（名字/描述等）
│
├── style_002/
│   ├── prompt.txt
│   ├── preview.png
│   ├── price.json
│   ├── config.json
│   └── meta.json
│
└── ...

===
得到的图片先在后台进行图片层面的模糊，不要在前端渲染。我怕有人去突破，把它做模糊，加水印。然后付款完之后，才让他下载高清的图片

====
gpt image2 的接口和codex好像是一致的