export default {
  app: {
    title: "🍌 Nano Bananary｜ZHO",
    history: "History",
    apiKey: "API Key",
    back: "Back",
    edit: "Edit",
    chooseAnotherEffect: "Choose Another Effect",
    generateImage: "Generate",
    generating: "Generating...",
    result: "Result",
    yourImageWillAppear: "Your generated image will appear here.",
    aspectRatio: "Aspect Ratio",
    chooseYourShot: "Choose your favorite shot to animate",
    regenerate: "Regenerate",
    createVideo: "Create Video",
    models: {
      nanoBanana: "Nano Banana",
      nanoBananaPro: "Nano Banana Pro"
    },
    error: {
      uploadAndSelect: "Please upload an image and select an effect.",
      uploadOne: "Please upload at least one image.",
      uploadBoth: "Please upload both required images.",
      enterPrompt: "Please enter a prompt describing the change you want to see.",
      unknown: "An unknown error occurred.",
      useAsInputFailed: "Could not use the generated image as a new input.",
      selectOneToAnimate: "Please select an image to animate.",
    },
    loading: {
      step1: "Step 1: Creating line art...",
      step2: "Step 2: Applying color palette...",
      default: "Generating your masterpiece...",
      wait: "This can sometimes take a moment.",
      videoInit: "Initializing video generation...",
      videoPolling: "Processing video, this may take a few minutes...",
      videoFetching: "Finalizing and fetching your video...",
      generatingOptions: "Generating image options...",
    },
    theme: {
        switchToLight: "Switch to light theme",
        switchToDark: "Switch to dark theme"
    }
  },
  transformationSelector: {
    title: "Let's Go Bananas!",
    description: "Ready to remix your reality? Pick a category to start the magic. You can also drag and drop to reorder your favorite categories.",
    descriptionWithResult: "That was fun! Your last creation is ready for another round. Select a new effect to keep the chain going."
  },
  imageEditor: {
    upload: "Click to upload",
    dragAndDrop: "or drag and drop",
    drawMask: "Draw Mask",
    maskPanelInfo: "Draw on the image to create a mask for localized edits.",
    brushSize: "Brush Size",
    undo: "Undo",
    clearMask: "Clear Mask"
  },
  resultDisplay: {
    viewModes: {
      result: "Result",
      grid: "Grid",
      slider: "Slider",
      sidebyside: "Side-by-Side"
    },
    labels: {
      original: "Original",
      generated: "Generated",
      lineArt: "Line Art",
      finalResult: "Final Result"
    },
    actions: {
      download: "Download",
      downloadBoth: "Download Both",
      downloadComparison: "Download Comparison",
      useAsInput: "Use as Input",
      useLineArtAsInput: "Use Line Art as Input",
      useFinalAsInput: "Use Final as Input"
    },
    sliderPicker: {
      vs: "vs"
    }
  },
  history: {
    title: "Generation History",
    empty: "Your generated images will appear here once you create something.",
    use: "Use",
    save: "Save",
    lineArt: "Line Art",
    finalResult: "Final Result"
  },
  error: {
    title: "An Error Occurred"
  },
  transformations: {
    categories: {
      viral: { title: "Viral & Fun" },
      photo: { title: "Photo & Pro Edits" },
      design: { title: "Design & Product" },
      tools: { title: "Creative Tools" },
      effects: { title: "50+ Artistic Effects" },
    },
    effects: {
      polaroid: { title: "Polaroid Group Photo", description: "Combine multiple photos into a fun, flash-lit polaroid snapshot with a party vibe." },
      customPrompt: { 
        title: "Custom Prompt", 
        description: "Generate an image from scratch or describe any change you can imagine. Upload an image for context (e.g., character or style reference). Your creativity is the only limit!",
        uploader1Title: "Primary Image",
        uploader1Desc: "The main image to edit.",
        uploader2Title: "Reference Image (Optional)",
        uploader2Desc: "A second image for style, content, or context." 
      },
      figurine: { title: "3D Figurine", description: "Turns your photo into a collectible 3D character figurine, complete with packaging." },
      cosplay: { title: "Anime to Cosplay", description: "Brings an anime character to life as a realistic cosplay photo." },
      pose: { title: "Pose Reference", description: "Applies a pose from one image to a character from another.", uploader1Title: "Character", uploader1Desc: "The main character", uploader2Title: "Pose Reference", uploader2Desc: "The pose to apply" },
      colorPalette: { title: "Color Palette Swap", description: "Converts an image to line art, then colors it using a second image as a palette.", uploader1Title: "Original Image", uploader1Desc: "The image to transform", uploader2Title: "Color Palette", uploader2Desc: "The color reference" },
      lineArt: { title: "Line Art Drawing", description: "Reduces your photo to its essential lines, creating a clean sketch." },
    }
  }
};
