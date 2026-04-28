



import type { Transformation } from './types';

export const MODELS = [
  { id: 'gemini-2.5-flash-image', nameKey: 'app.models.nanoBanana', badge: 'Fast' },
  { id: 'gemini-3-pro-image-preview', nameKey: 'app.models.nanoBananaPro', badge: 'Pro' },
];

export const TRANSFORMATIONS: Transformation[] = [
  // Prioritized items as requested by the user
  {
    key: "polaroid",
    titleKey: "transformations.effects.polaroid.title",
    prompt: "生成一张亲密合照的拍立得照片。照片带有略微的模糊效果，使用闪光灯在室内拍摄，仿佛派对刚结束。保持亲密又搞笑的姿势，捕捉到轻松有趣的氛围，带有温馨与幽默感",
    emoji: "🎞️",
    descriptionKey: "transformations.effects.polaroid.description",
    maxImages: 4,
  },
  {
    key: "dynamicPolaroid",
    titleKey: "transformations.effects.dynamicPolaroid.title",
    prompt: "生成一张亲密合照的拍立得照片。照片带有略微的模糊效果，使用闪光灯在室内拍摄，仿佛派对刚结束。保持亲密又搞笑的姿势，捕捉到轻松有趣的氛围，带有温馨与幽默感",
    videoPrompt: "Make this polaroid photo come to life with subtle, happy movements. The people should laugh and shift slightly, as if captured in a brief, joyful moment. Maintain the polaroid and flash photography aesthetic.",
    emoji: "📸",
    descriptionKey: "transformations.effects.dynamicPolaroid.description",
    maxImages: 4,
    isMultiStepVideo: true,
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
    prompt: "turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible", 
    emoji: "🧍",
    descriptionKey: "transformations.effects.figurine.description"
  },
  {
    key: "videoGeneration",
    titleKey: "transformations.video.title",
    emoji: "🎬",
    descriptionKey: "transformations.video.description",
    isVideo: true,
    prompt: "CUSTOM",
  },
  { 
    key: "cosplay",
    titleKey: "transformations.effects.cosplay.title", 
    prompt: "Generate a highly detailed photo of a girl cosplaying this illustration, at Comiket. Exactly replicate the same pose, body posture, hand gestures, facial expression, and camera framing as in the original illustration. Keep the same angle, perspective, and composition, without any deviation", 
    emoji: "🎭",
    descriptionKey: "transformations.effects.cosplay.description"
  },
  {
    key: "category_effects",
    titleKey: "transformations.categories.effects.title",
    emoji: "✨",
    items: [
      { key: "pixelArt", titleKey: "transformations.effects.pixelArt.title", prompt: "Redraw the image in a retro 8-bit pixel art style.", emoji: "👾", descriptionKey: "transformations.effects.pixelArt.description" },
      { key: "watercolor", titleKey: "transformations.effects.watercolor.title", prompt: "Transform the image into a soft and vibrant watercolor painting.", emoji: "🖌️", descriptionKey: "transformations.effects.watercolor.description" },
      { key: "popArt", titleKey: "transformations.effects.popArt.title", prompt: "Reimagine the image in the style of Andy Warhol's pop art, with bold colors and screen-print effects.", emoji: "🎨", descriptionKey: "transformations.effects.popArt.description" },
      { key: "comicBook", titleKey: "transformations.effects.comicBook.title", prompt: "Convert the image into a classic comic book panel with halftones, bold outlines, and action text.", emoji: "💥", descriptionKey: "transformations.effects.comicBook.description" },
      { key: "claymation", titleKey: "transformations.effects.claymation.title", prompt: "Recreate the image as a charming stop-motion claymation scene.", emoji: "🗿", descriptionKey: "transformations.effects.claymation.description" },
      { key: "ukiyoE", titleKey: "transformations.effects.ukiyoE.title", prompt: "Redraw the image in the style of a traditional Japanese Ukiyo-e woodblock print.", emoji: "🌊", descriptionKey: "transformations.effects.ukiyoE.description" },
      { key: "stainedGlass", titleKey: "transformations.effects.stainedGlass.title", prompt: "Transform the image into a vibrant stained glass window with dark lead lines.", emoji: "🪟", descriptionKey: "transformations.effects.stainedGlass.description" },
      { key: "origami", titleKey: "transformations.effects.origami.title", prompt: "Reconstruct the subject of the image using folded paper in an origami style.", emoji: "🦢", descriptionKey: "transformations.effects.origami.description" },
      { key: "neonGlow", titleKey: "transformations.effects.neonGlow.title", prompt: "Outline the subject in bright, glowing neon lights against a dark background.", emoji: "💡", descriptionKey: "transformations.effects.neonGlow.description" },
      { key: "doodleArt", titleKey: "transformations.effects.doodleArt.title", prompt: "Overlay the image with playful, hand-drawn doodle-style illustrations.", emoji: "✏️", descriptionKey: "transformations.effects.doodleArt.description" },
      { key: "vintagePhoto", titleKey: "transformations.effects.vintagePhoto.title", prompt: "Give the image an aged, sepia-toned vintage photograph look from the early 20th century.", emoji: "📜", descriptionKey: "transformations.effects.vintagePhoto.description" },
      { key: "blueprintSketch", titleKey: "transformations.effects.blueprintSketch.title", prompt: "Convert the image into a technical blueprint-style architectural drawing.", emoji: "📐", descriptionKey: "transformations.effects.blueprintSketch.description" },
      { key: "glitchArt", titleKey: "transformations.effects.glitchArt.title", prompt: "Apply a digital glitch effect with datamoshing, pixel sorting, and RGB shifts.", emoji: "📉", descriptionKey: "transformations.effects.glitchArt.description" },
      { key: "doubleExposure", titleKey: "transformations.effects.doubleExposure.title", prompt: "Create a double exposure effect, blending the image with a nature scene like a forest or a mountain range.", emoji: "🏞️", descriptionKey: "transformations.effects.doubleExposure.description" },
      { key: "hologram", titleKey: "transformations.effects.hologram.title", prompt: "Project the subject as a futuristic, glowing blue hologram.", emoji: "🌐", descriptionKey: "transformations.effects.hologram.description" },
      { key: "lowPoly", titleKey: "transformations.effects.lowPoly.title", prompt: "Reconstruct the image using a low-polygon geometric mesh.", emoji: "🔺", descriptionKey: "transformations.effects.lowPoly.description" },
      { key: "charcoalSketch", titleKey: "transformations.effects.charcoalSketch.title", prompt: "Redraw the image as a dramatic, high-contrast charcoal sketch on textured paper.", emoji: "✍🏽", descriptionKey: "transformations.effects.charcoalSketch.description" },
      { key: "impressionism", titleKey: "transformations.effects.impressionism.title", prompt: "Repaint the image in the style of an Impressionist masterpiece, with visible brushstrokes and a focus on light.", emoji: "👨‍🎨", descriptionKey: "transformations.effects.impressionism.description" },
      { key: "cubism", titleKey: "transformations.effects.cubism.title", prompt: "Deconstruct and reassemble the subject in the abstract, geometric style of Cubism.", emoji: "🧊", descriptionKey: "transformations.effects.cubism.description" },
      { key: "steampunk", titleKey: "transformations.effects.steampunk.title", prompt: "Reimagine the subject with steampunk aesthetics, featuring gears, brass, and Victorian-era technology.", emoji: "⚙️", descriptionKey: "transformations.effects.steampunk.description" },
      { key: "fantasyArt", titleKey: "transformations.effects.fantasyArt.title", prompt: "Transform the image into an epic fantasy-style painting, with magical elements and dramatic lighting.", emoji: "🐉", descriptionKey: "transformations.effects.fantasyArt.description" },
      { key: "graffiti", titleKey: "transformations.effects.graffiti.title", prompt: "Spray-paint the image as vibrant graffiti on a brick wall.", emoji: "🎨", descriptionKey: "transformations.effects.graffiti.description" },
      { key: "minimalistLineArt", titleKey: "transformations.effects.minimalistLineArt.title", prompt: "Reduce the image to a single, continuous, minimalist line drawing.", emoji: "〰️", descriptionKey: "transformations.effects.minimalistLineArt.description" },
      { key: "storybook", titleKey: "transformations.effects.storybook.title", prompt: "Redraw the image in the style of a whimsical children's storybook illustration.", emoji: "📖", descriptionKey: "transformations.effects.storybook.description" },
      { key: "thermal", titleKey: "transformations.effects.thermal.title", prompt: "Apply a thermal imaging effect with a heat map color palette.", emoji: "🌡️", descriptionKey: "transformations.effects.thermal.description" },
      { key: "risograph", titleKey: "transformations.effects.risograph.title", prompt: "Simulate a risograph print effect with grainy textures and limited, overlapping color layers.", emoji: "📠", descriptionKey: "transformations.effects.risograph.description" },
      { key: "crossStitch", titleKey: "transformations.effects.crossStitch.title", prompt: "Convert the image into a textured, handmade cross-stitch pattern.", emoji: "🧵", descriptionKey: "transformations.effects.crossStitch.description" },
      { key: "tattoo", titleKey: "transformations.effects.tattoo.title", prompt: "Redesign the subject as a classic American traditional style tattoo.", emoji: "🖋️", descriptionKey: "transformations.effects.tattoo.description" },
      { key: "psychedelic", titleKey: "transformations.effects.psychedelic.title", prompt: "Apply a vibrant, swirling, psychedelic art style from the 1960s.", emoji: "🌀", descriptionKey: "transformations.effects.psychedelic.description" },
      { key: "gothic", titleKey: "transformations.effects.gothic.title", prompt: "Reimagine the scene with a dark, gothic art style, featuring dramatic shadows and architecture.", emoji: "🏰", descriptionKey: "transformations.effects.gothic.description" },
      { key: "tribal", titleKey: "transformations.effects.tribal.title", prompt: "Redraw the subject using patterns and motifs from traditional tribal art.", emoji: "🗿", descriptionKey: "transformations.effects.tribal.description" },
      { key: "dotPainting", titleKey: "transformations.effects.dotPainting.title", prompt: "Recreate the image using the dot painting technique of Aboriginal art.", emoji: "🎨", descriptionKey: "transformations.effects.dotPainting.description" },
      { key: "chalk", titleKey: "transformations.effects.chalk.title", prompt: "Draw the image as a colorful chalk illustration on a sidewalk.", emoji: "🖍️", descriptionKey: "transformations.effects.chalk.description" },
      { key: "sandArt", titleKey: "transformations.effects.sandArt.title", prompt: "Recreate the image as if it were made from colored sand.", emoji: "🏜️", descriptionKey: "transformations.effects.sandArt.description" },
      { key: "mosaic", titleKey: "transformations.effects.mosaic.title", prompt: "Transform the image into a mosaic made of small ceramic tiles.", emoji: "💠", descriptionKey: "transformations.effects.mosaic.description" },
      { key: "paperQuilling", titleKey: "transformations.effects.paperQuilling.title", prompt: "Reconstruct the subject using the art of paper quilling, with rolled and shaped strips of paper.", emoji: "📜", descriptionKey: "transformations.effects.paperQuilling.description" },
      { key: "woodCarving", titleKey: "transformations.effects.woodCarving.title", prompt: "Recreate the subject as a detailed wood carving.", emoji: "🪵", descriptionKey: "transformations.effects.woodCarving.description" },
      { key: "iceSculpture", titleKey: "transformations.effects.iceSculpture.title", prompt: "Transform the subject into a translucent, detailed ice sculpture.", emoji: "🧊", descriptionKey: "transformations.effects.iceSculpture.description" },
      { key: "bronzeStatue", titleKey: "transformations.effects.bronzeStatue.title", prompt: "Turn the subject into a weathered bronze statue on a pedestal.", emoji: "🗿", descriptionKey: "transformations.effects.bronzeStatue.description" },
      { key: "galaxy", titleKey: "transformations.effects.galaxy.title", prompt: "Blend the image with a vibrant nebula and starry galaxy background.", emoji: "🌌", descriptionKey: "transformations.effects.galaxy.description" },
      { key: "fire", titleKey: "transformations.effects.fire.title", prompt: "Reimagine the subject as if it were formed from roaring flames.", emoji: "🔥", descriptionKey: "transformations.effects.fire.description" },
      { key: "water", titleKey: "transformations.effects.water.title", prompt: "Reimagine the subject as if it were formed from flowing, liquid water.", emoji: "💧", descriptionKey: "transformations.effects.water.description" },
      { key: "smokeArt", titleKey: "transformations.effects.smokeArt.title", prompt: "Create the subject from elegant, swirling wisps of smoke.", emoji: "💨", descriptionKey: "transformations.effects.smokeArt.description" },
      { key: "vectorArt", titleKey: "transformations.effects.vectorArt.title", prompt: "Convert the photo into clean, scalable vector art with flat colors and sharp lines.", emoji: "🎨", descriptionKey: "transformations.effects.vectorArt.description" },
      { key: "infrared", titleKey: "transformations.effects.infrared.title", prompt: "Simulate an infrared photo effect with surreal colors and glowing foliage.", emoji: "📸", descriptionKey: "transformations.effects.infrared.description" },
      { key: "knitted", titleKey: "transformations.effects.knitted.title", prompt: "Recreate the image as a cozy, knitted wool pattern.", emoji: "🧶", descriptionKey: "transformations.effects.knitted.description" },
      { key: "etching", titleKey: "transformations.effects.etching.title", prompt: "Redraw the image as a classic black and white etching or engraving.", emoji: "✒️", descriptionKey: "transformations.effects.etching.description" },
      { key: "diorama", titleKey: "transformations.effects.diorama.title", prompt: "Turn the scene into a miniature 3D diorama inside a box.", emoji: "📦", descriptionKey: "transformations.effects.diorama.description" },
    ]
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
    key: "expressionReference",
    titleKey: "transformations.effects.expressionReference.title", 
    prompt: "Change the expression of the character in the first image to match the expression of the character in the second image.",
    emoji: "😀",
    descriptionKey: "transformations.effects.expressionReference.description",
    isMultiImage: true,
    primaryUploaderTitle: "transformations.effects.expressionReference.uploader1Title",
    primaryUploaderDescription: "transformations.effects.expressionReference.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.expressionReference.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.expressionReference.uploader2Desc",
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
    prompt: "Turn this image into a clean, hand-drawn line art sketch.", // Step 1 prompt
    stepTwoPrompt: "Color the line art using the colors from the second image.", // Step 2 prompt
    emoji: "🎨",
    descriptionKey: "transformations.effects.colorPalette.description",
    isMultiImage: true,
    isTwoStep: true,
    primaryUploaderTitle: "transformations.effects.colorPalette.uploader1Title",
    primaryUploaderDescription: "transformations.effects.colorPalette.uploader1Desc",
    secondaryUploaderTitle: "transformations.effects.colorPalette.uploader2Title",
    secondaryUploaderDescription: "transformations.effects.colorPalette.uploader2Desc",
  },
  { 
    key: "iphoneWallpaper",
    titleKey: "transformations.effects.iphoneWallpaper.title", 
    prompt: "Turn the image into an iPhone lock screen wallpaper effect, with the phone's time (01:16), date (Sunday, September 16), and status bar information (battery, signal, etc.), with the flashlight and camera buttons at the bottom, overlaid on the image. The original image should be adapted to a vertical composition that fits a phone screen. The phone is placed on a solid color background of the same color scheme.",
    emoji: "📱",
    descriptionKey: "transformations.effects.iphoneWallpaper.description"
  },
  { 
    key: "sodaCan",
    titleKey: "transformations.effects.sodaCan.title", 
    prompt: "Design a soda can using this image as the main graphic, and show it in a professional product shot.", 
    emoji: "🥤",
    descriptionKey: "transformations.effects.sodaCan.description"
  },
  {
    key: "minimalistIllustration",
    titleKey: "transformations.effects.minimalistIllustration.title",
    prompt: "Turn the people in these images into cute, black and white minimalist illustrations. Each person should be drawn with their unique characteristics and a fitting small prop. The lines should be elegant, and the hair should be a solid black block. Arrange all characters into a single grid image.",
    emoji: "⚫",
    descriptionKey: "transformations.effects.minimalistIllustration.description",
    maxImages: 4,
  },
  // Remaining items from flattened categories
  { 
    key: "funko",
    titleKey: "transformations.effects.funko.title", 
    prompt: "Transform the person into a Funko Pop figure, shown inside and next to its packaging.", 
    emoji: "📦",
    descriptionKey: "transformations.effects.funko.description"
  },
  { 
    key: "lego",
    titleKey: "transformations.effects.lego.title", 
    prompt: "Transform the person into a LEGO minifigure, inside its packaging box.", 
    emoji: "🧱",
    descriptionKey: "transformations.effects.lego.description"
  },
  { 
    key: "crochet",
    titleKey: "transformations.effects.crochet.title", 
    prompt: "Transform the subject into a handmade crocheted yarn doll with a cute, chibi-style appearance.", 
    emoji: "🧶",
    descriptionKey: "transformations.effects.crochet.description"
  },
  { 
    key: "plushie",
    titleKey: "transformations.effects.plushie.title", 
    prompt: "Turn the person in this photo into a cute, soft plushie doll.", 
    emoji: "🧸",
    descriptionKey: "transformations.effects.plushie.description"
  },
  { 
    key: "keychain",
    titleKey: "transformations.effects.keychain.title", 
    prompt: "Turn the subject into a cute acrylic keychain, shown attached to a bag.", 
    emoji: "🔑",
    descriptionKey: "transformations.effects.keychain.description"
  },
  { 
    key: "hdEnhance",
    titleKey: "transformations.effects.hdEnhance.title", 
    prompt: "Enhance this image to high resolution, improving sharpness and clarity.", 
    emoji: "🔍",
    descriptionKey: "transformations.effects.hdEnhance.description"
  },
  { 
    key: "photorealistic",
    titleKey: "transformations.effects.photorealistic.title", 
    prompt: "Turn this illustration into a photorealistic version.", 
    emoji: "🪄",
    descriptionKey: "transformations.effects.photorealistic.description"
  },
  { 
    key: "fashion",
    titleKey: "transformations.effects.fashion.title", 
    prompt: "Transform the photo into a stylized, ultra-realistic fashion magazine portrait with cinematic lighting.", 
    emoji: "📸",
    descriptionKey: "transformations.effects.fashion.description"
  },
  { 
    key: "hyperrealistic",
    titleKey: "transformations.effects.hyperrealistic.title", 
    prompt: "Generate a hyper-realistic, fashion-style photo with strong, direct flash lighting, grainy texture, and a cool, confident pose.", 
    emoji: "✨",
    descriptionKey: "transformations.effects.hyperrealistic.description"
  },
  { 
    key: "architecture",
    titleKey: "transformations.effects.architecture.title", 
    prompt: "Convert this photo of a building into a miniature architecture model, placed on a cardstock in an indoor setting. Show a computer with modeling software in the background.", 
    emoji: "🏗️",
    descriptionKey: "transformations.effects.architecture.description"
  },
  { 
    key: "productRender",
    titleKey: "transformations.effects.productRender.title", 
    prompt: "Turn this product sketch into a photorealistic 3D render with studio lighting.", 
    emoji: "💡",
    descriptionKey: "transformations.effects.productRender.description"
  },
  { 
    key: "industrialDesign",
    titleKey: "transformations.effects.industrialDesign.title", 
    prompt: "Turn this industrial design sketch into a realistic product photo, rendered with light brown leather and displayed in a minimalist museum setting.", 
    emoji: "🛋️",
    descriptionKey: "transformations.effects.industrialDesign.description"
  },
  { 
    key: "isolate",
    titleKey: "transformations.effects.isolate.title", 
    prompt: "Isolate the person in the masked area and generate a high-definition photo of them against a neutral background.", 
    emoji: "🎯",
    descriptionKey: "transformations.effects.isolate.description"
  },
  { 
    key: "screen3d",
    titleKey: "transformations.effects.screen3d.title", 
    prompt: "For an image with a screen, add content that appears to be glasses-free 3D, popping out of the screen.", 
    emoji: "📺",
    descriptionKey: "transformations.effects.screen3d.description"
  },
  { 
    key: "makeup",
    titleKey: "transformations.effects.makeup.title", 
    prompt: "Analyze the makeup in this photo and suggest improvements by drawing with a red pen.", 
    emoji: "💄",
    descriptionKey: "transformations.effects.makeup.description"
  },
  { 
    key: "background",
    titleKey: "transformations.effects.background.title", 
    prompt: "Change the background to a Y2K aesthetic style.", 
    emoji: "🪩",
    descriptionKey: "transformations.effects.background.description"
  },
  { 
    key: "addIllustration",
    titleKey: "transformations.effects.addIllustration.title", 
    prompt: "Add a cute, cartoon-style illustrated couple into the real-world scene, sitting and talking.", 
    emoji: "🧑‍🎨",
    descriptionKey: "transformations.effects.addIllustration.description"
  },
  { 
    key: "paintingProcess", 
    titleKey: "transformations.effects.paintingProcess.title", 
    prompt: "Generate a 4-panel grid showing the artistic process of creating this image, from sketch to final render.", 
    emoji: "🖼️", 
    descriptionKey: "transformations.effects.paintingProcess.description" 
  },
  { 
    key: "markerSketch", 
    titleKey: "transformations.effects.markerSketch.title", 
    prompt: "Redraw the image in the style of a Copic marker sketch, often used in design.", 
    emoji: "🖊️", 
    descriptionKey: "transformations.effects.markerSketch.description" 
  },
  { 
    key: "cyberpunk", 
    titleKey: "transformations.effects.cyberpunk.title", 
    prompt: "Transform the scene into a futuristic cyberpunk city.", 
    emoji: "🤖", 
    descriptionKey: "transformations.effects.cyberpunk.description" 
  },
  { 
    key: "vanGogh", 
    titleKey: "transformations.effects.vanGogh.title", 
    prompt: "Reimagine the photo in the style of Van Gogh's 'Starry Night'.", 
    emoji: "🌌", 
    descriptionKey: "transformations.effects.vanGogh.description" 
  },
];