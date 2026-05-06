import type { Transformation } from '../types';

export const MODELS = [
  { id: 'gemini/gemini-2.5-flash-image', nameKey: 'app.models.geminiFlash', badge: 'Fast', provider: 'Google Gemini' },
  { id: 'gemini/gemini-3-pro-image-preview', nameKey: 'app.models.geminiPro', badge: 'Pro', provider: 'Google Gemini' },
  { id: 'openai/gpt-image-2', nameKey: 'app.models.gptImage2', badge: 'Latest', provider: 'OpenAI' },
  { id: 'openai/dall-e-3', nameKey: 'app.models.dallE3', badge: 'Classic', provider: 'OpenAI' },
  { id: 'tongyi/wanx-v2.6', nameKey: 'app.models.tongyiV26', badge: '增强', provider: '通义万相' },
  { id: 'tongyi/wanx-v1', nameKey: 'app.models.tongyiV1', badge: '基础', provider: '通义万相' },
];

export const TRANSFORMATIONS: Transformation[] = [
  {
    key: "polaroid",
    titleKey: "transformations.effects.polaroid.title",
    prompt: "生成一张亲密合照的拍立得照片。照片带有略微的模糊效果，使用闪光灯在室内拍摄，仿佛派对刚结束。保持亲密又搞笑的姿势，捕捉到轻松有趣的氛围，带有温馨与幽默感",
    emoji: "🎞️",
    descriptionKey: "transformations.effects.polaroid.description",
    maxImages: 4,
  },
  {
    key: "customPrompt",
    titleKey: "transformations.effects.customPrompt.title",
    prompt: "CUSTOM",
    emoji: "✍️",
    descriptionKey: "transformations.effects.customPrompt.description",
    isMultiImage: true,
    isSecondaryOptional: true,
    primaryUploaderTitle: "transformations.effects.customPrompt.uploader1Title",
    primaryUploaderDescription: "transformations.effects.customPrompt.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.customPrompt.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.customPrompt.uploader2Desc",
  },
  {
    key: "figurine",
    titleKey: "transformations.effects.figurine.title",
    prompt: "turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible",
    emoji: "🧍",
    descriptionKey: "transformations.effects.figurine.description"
  },
  {
    key: "cosplay",
    titleKey: "transformations.effects.cosplay.title",
    prompt: "Generate a highly detailed photo of a girl cosplaying this illustration, at Comiket. Exactly replicate the same pose, body posture, hand gestures, facial expression, and camera framing as in the original illustration. Keep the same angle, perspective, and composition, without any deviation",
    emoji: "🎭",
    descriptionKey: "transformations.effects.cosplay.description"
  },
  {
    key: "pose",
    titleKey: "transformations.effects.pose.title",
    prompt: "Apply the pose from the second image to the character in the first image. Render as a professional studio photograph.",
    emoji: "💃",
    descriptionKey: "transformations.effects.pose.description",
    isMultiImage: true,
    primaryUploaderTitle: "transformations.effects.pose.uploader1Title",
    primaryUploaderDescription: "transformations.effects.pose.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.pose.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.pose.uploader2Desc",
  },
  {
    key: "lineArt",
    titleKey: "transformations.effects.lineArt.title",
    prompt: "Turn the image into a clean, hand-drawn line art sketch.",
    emoji: "✍🏻",
    descriptionKey: "transformations.effects.lineArt.description"
  },
  {
    key: "colorPalette",
    titleKey: "transformations.effects.colorPalette.title",
    prompt: "Turn this image into a clean, hand-drawn line art sketch.",
    stepTwoPrompt: "Color the line art using the colors from the second image.",
    emoji: "🎨",
    descriptionKey: "transformations.effects.colorPalette.description",
    isMultiImage: true,
    isTwoStep: true,
    primaryUploaderTitle: "transformations.effects.colorPalette.uploader1Title",
    primaryUploaderDescription: "transformations.effects.colorPalette.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.colorPalette.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.colorPalette.uploader2Desc",
  },
];
