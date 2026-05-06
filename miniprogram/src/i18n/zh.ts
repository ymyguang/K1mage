export default {
  app: {
    title: "🍌 香蕉超市｜ZHO",
    history: "历史记录",
    apiKey: "API Key",
    back: "返回",
    edit: "编辑",
    chooseAnotherEffect: "选择其他效果",
    generateImage: "生成",
    generating: "生成中...",
    result: "结果",
    yourImageWillAppear: "您生成的图像将显示在这里。",
    aspectRatio: "宽高比",
    chooseYourShot: "选择你最喜欢的照片制作成动画",
    regenerate: "重新生成",
    createVideo: "创建视频",
    models: {
      nanoBanana: "Nano Banana (标准版)",
      nanoBananaPro: "Nano Banana Pro (专业版)"
    },
    error: {
      uploadAndSelect: "请上传图像并选择一个效果。",
      uploadOne: "请至少上传一张图片。",
      uploadBoth: "请上传两个所需的图像。",
      enterPrompt: "请输入一个描述您想看到的更改的提示。",
      unknown: "发生未知错误。",
      useAsInputFailed: "无法使用生成的图像作为新输入。",
      selectOneToAnimate: "请选择一张图片以制作动画。",
    },
    loading: {
        step1: "第1步：创建线稿...",
        step2: "第2步：应用调色板...",
        default: "正在生成您的杰作...",
        wait: "这有时可能需要一些时间。",
        videoInit: "正在初始化视频生成...",
        videoPolling: "正在处理视频，这可能需要几分钟...",
        videoFetching: "正在完成并获取您的视频...",
        generatingOptions: "正在生成图片选项...",
    },
    theme: {
        switchToLight: "切换到浅色主题",
        switchToDark: "切换到深色主题"
    }
  },
  transformationSelector: {
    title: "开始蕉虑吧！",
    description: "准备好重塑你的现实了吗？选择一个类别开始施展魔法。你也可以拖放来重新排序你最喜欢的类别。",
    descriptionWithResult: "真有趣！你上一个创作已经准备好进行下一轮了。选择一个新的效果来继续这个创作链吧。"
  },
  imageEditor: {
    upload: "点击上传",
    dragAndDrop: "或拖放文件",
    drawMask: "绘制蒙版",
    maskPanelInfo: "在图像上绘制以创建用于局部编辑的蒙版。",
    brushSize: "笔刷大小",
    undo: "撤销",
    clearMask: "清除蒙版"
  },
  resultDisplay: {
    viewModes: {
      result: "结果",
      grid: "网格",
      slider: "滑块",
      sidebyside: "并排"
    },
    labels: {
      original: "原图",
      generated: "生成图",
      lineArt: "线稿",
      finalResult: "最终结果"
    },
    actions: {
      download: "下载",
      downloadBoth: "下载全部",
      downloadComparison: "下载对比图",
      useAsInput: "用作输入",
      useLineArtAsInput: "使用线稿作为输入",
      useFinalAsInput: "使用最终结果作为输入"
    },
    sliderPicker: {
      vs: "对"
    }
  },
  history: {
    title: "生成历史",
    empty: "一旦您创造了某些东西，您生成的图像就会出现在这里。",
    use: "使用",
    save: "保存",
    lineArt: "线稿",
    finalResult: "最终结果"
  },
  error: {
    title: "发生错误"
  },
  transformations: {
    categories: {
      viral: { title: "网红玩法" },
      photo: { title: "专业照片编辑" },
      design: { title: "设计与产品" },
      tools: { title: "创意工具" },
      effects: { title: "50+ 艺术效果" },
    },
    effects: {
      polaroid: { title: "拍立得合照", description: "将多张照片融合成一张温馨又搞笑的拍立得合照，捕捉派对结束后的欢乐瞬间。" },
      customPrompt: { 
        title: "自定义提示", 
        description: "从头生成一张图片，或描述你能想象到的任何变化。上传一张图片作为参考（例如，角色或风格参考）。你的创造力是唯一的限制！",
        uploader1Title: "主图像",
        uploader1Desc: "要编辑的主要图像。",
        uploader2Title: "参考图像（可选）",
        uploader2Desc: "用于风格、内容或上下文的第二张图像。" 
      },
      figurine: { title: "3D手办", description: "将您的照片变成一个可收藏的3D角色手办，并配有包装。" },
      cosplay: { title: "动漫转Cosplay", description: "将动漫角色变为一张逼真的Cosplay照片。" },
      pose: { title: "姿势参考", description: "将一张图像中的姿势应用到另一张图像中的角色上。", uploader1Title: "角色", uploader1Desc: "主要角色", uploader2Title: "姿势参考", uploader2Desc: "要应用的姿势" },
      colorPalette: { title: "色板换色", description: "将图像转换为线稿，然后使用第二张图像作为调色板为其上色。", uploader1Title: "原始图像", uploader1Desc: "要转换的图像", uploader2Title: "调色板", uploader2Desc: "颜色参考" },
      lineArt: { title: "线稿绘画", description: "将您的照片简化为其基本线条，创建一个干净的草图。" },
    }
  }
};
