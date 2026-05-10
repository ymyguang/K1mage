import { GoogleGenAI, Modality } from "@google/genai";
import type { GeneratedContent } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

// NOTE: We instantiate GoogleGenAI inside functions to ensure we capture the latest API_KEY
// from process.env, which might be updated by the platform (e.g. window.aistudio.openSelectKey).

// Helper for error handling
const handleGeminiError = (error: unknown, context: string): never => {
    console.error(`Error calling Gemini API (${context}):`, error);
    if (error instanceof Error) {
        let errorMessage = error.message;
        try {
            // Attempt to parse JSON error message if it comes in that format
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
            // Fallback for string matching if JSON parse fails
            if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
                errorMessage = "This model requires a paid API key. Please select a valid API key with billing enabled.";
            }
        }
        throw new Error(errorMessage);
    }
    throw new Error(`An unknown error occurred during ${context}.`);
};

export async function editImage(
    prompt: string,
    imageParts: { base64: string; mimeType: string }[],
    maskBase64: string | null,
    model: string = 'gemini-2.5-flash-image'
): Promise<GeneratedContent> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let fullPrompt = prompt;
    const parts: any[] = [];

    // The primary image is always the first one.
    if (imageParts.length > 0) {
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
    
    // Add any remaining images (secondary, tertiary, etc.)
    if (imageParts.length > 1) {
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
        responseModalities: [Modality.IMAGE], // Strictly request IMAGE modality for this model
      },
    });

    const result: GeneratedContent = { imageUrl: null, text: null };
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
        throw new Error(errorMessage);
    }

    return result;

  } catch (error) {
    handleGeminiError(error, 'editImage');
    throw error;
  }
}

export async function generateImageEditsBatch(
    prompt: string,
    imageParts: { base64: string; mimeType: string }[],
    model: string = 'gemini-2.5-flash-image'
): Promise<string[]> {
    try {
        const promises: Promise<GeneratedContent>[] = [];
        for (let i = 0; i < 4; i++) {
            // Pass null for maskBase64 as this flow doesn't use it.
            promises.push(editImage(prompt, imageParts, null, model));
        }
        const results = await Promise.all(promises);
        const imageUrls = results.map(r => r.imageUrl).filter((url): url is string => !!url);
        
        if (imageUrls.length === 0) {
          throw new Error("Failed to generate any image variations. The model may have refused the request.");
        }
        
        return imageUrls;
    } catch (error) {
        console.error("Error generating image edits batch:", error);
        if (error instanceof Error) {
            // Re-throw the specific error message from a failed child `editImage` call
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred during batch image generation.");
    }
}

type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export async function generateImageFromText(
    prompt: string,
    aspectRatio: ImageAspectRatio,
    model: string = 'gemini-2.5-flash-image'
): Promise<GeneratedContent> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Use structured imageConfig for aspect ratio
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

    const result: GeneratedContent = { imageUrl: null, text: null };
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
        throw new Error(errorMessage);
    }

    return result;

  } catch (error) {
    handleGeminiError(error, 'generateImageFromText');
    throw error;
  }
}

export async function generateVideo(
    prompt: string,
    image: { base64: string; mimeType: string } | null,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        onProgress("Initializing video generation...");

        const request: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            },
        };
        
        if (image) {
            request.image = {
                imageBytes: image.base64,
                mimeType: image.mimeType
            };
        }

        let operation = await ai.models.generateVideos(request);
        
        onProgress("Polling for results, this may take a few minutes...");

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
             throw new Error(typeof operation.error.message === 'string' ? (operation.error.message || "Video generation failed.") : "Video generation failed.");
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }

        return `${downloadLink}&key=${process.env.API_KEY}`;

    } catch (error) {
        handleGeminiError(error, 'generateVideo');
        throw error;
    }
}