import express from 'express';
import { GoogleGenAI, Modality } from '@google/genai';

const router = express.Router();

const handleGeminiError = (error, context) => {
  console.error(`Error calling Gemini API (${context}):`, error);
  if (error instanceof Error) {
    let errorMessage = error.message;
    try {
      const parsedError = JSON.parse(errorMessage);
      if (parsedError.error && parsedError.error.message) {
        if (parsedError.error.status === 'RESOURCE_EXHAUSTED') {
          errorMessage = "You've likely exceeded the request limit. Please wait a moment before trying again.";
        } else if (parsedError.error.code === 500 || parsedError.error.status === 'UNKNOWN') {
          errorMessage = "An unexpected server error occurred. This might be a temporary issue. Please try again in a few moments.";
        } else if (parsedError.error.code === 403 || parsedError.error.status === 'PERMISSION_DENIED') {
          errorMessage = "This model requires a paid API key. Please select a valid API key with billing enabled.";
        } else {
          errorMessage = parsedError.error.message;
        }
      }
    } catch (e) {
      if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "This model requires a paid API key. Please select a valid API key with billing enabled.";
      }
    }
    throw new Error(errorMessage);
  }
  throw new Error(`An unknown error occurred during ${context}.`);
};

router.post('/edit-image', async (req, res) => {
  try {
    const { prompt, imageParts, maskBase64, model = 'gemini-2.5-flash-image', apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const ai = new GoogleGenAI({ apiKey });
    let fullPrompt = prompt;
    const parts = [];

    if (imageParts && imageParts.length > 0) {
      parts.push({
        inlineData: { data: imageParts[0].base64, mimeType: imageParts[0].mimeType },
      });
    }

    if (maskBase64) {
      parts.push({
        inlineData: { data: maskBase64, mimeType: 'image/png' },
      });
      fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
    }

    if (imageParts && imageParts.length > 1) {
      imageParts.slice(1).forEach(img => {
        parts.push({
          inlineData: { data: img.base64, mimeType: img.mimeType },
        });
      });
    }

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const result = { imageUrl: null, text: null };
    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.text) {
          result.text = (result.text ? result.text + "\n" : "") + part.text;
        } else if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!result.imageUrl) {
      let errorMessage;
      if (result.text) {
        errorMessage = `The model responded: "${result.text}"`;
      } else {
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        if (finishReason === 'SAFETY') {
          const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
          errorMessage = `The request was blocked for safety reasons. Categories: ${blockedCategories || 'Unknown'}. Please modify your prompt or image.`;
        } else {
          errorMessage = "The model did not return an image. It might have refused the request.";
        }
      }
      return res.status(400).json({ error: errorMessage });
    }

    res.json(result);
  } catch (error) {
    try {
      handleGeminiError(error, 'editImage');
    } catch (handledError) {
      return res.status(500).json({ error: handledError.message });
    }
    res.status(500).json({ error: 'An unknown error occurred' });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', model = 'gemini-2.5-flash-image', apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      },
    });

    const result = { imageUrl: null, text: null };
    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.text) {
          result.text = (result.text ? result.text + "\n" : "") + part.text;
        } else if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!result.imageUrl) {
      let errorMessage;
      if (result.text) {
        errorMessage = `The model responded: "${result.text}"`;
      } else {
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        if (finishReason === 'SAFETY') {
          const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
          errorMessage = `The request was blocked for safety reasons. Categories: ${blockedCategories || 'Unknown'}.`;
        } else {
          errorMessage = "The model did not return an image.";
        }
      }
      return res.status(400).json({ error: errorMessage });
    }

    res.json(result);
  } catch (error) {
    try {
      handleGeminiError(error, 'generateImageFromText');
    } catch (handledError) {
      return res.status(500).json({ error: handledError.message });
    }
    res.status(500).json({ error: 'An unknown error occurred' });
  }
});

export default router;
