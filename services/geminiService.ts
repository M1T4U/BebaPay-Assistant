import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Initialize Gemini with the API key from Vite env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set.");
  throw new Error("VITE_GEMINI_API_KEY is missing.");
}

const ai = new GoogleGenAI({ apiKey });

export const startChatSession = (): Chat => {
  const chat: Chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return chat;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const image = response?.generatedImages?.[0]?.image;
    const imageBytes = image?.imageBytes;

    if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
    } else {
      throw new Error('No image was generated or the image is incomplete.');
    }

  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image. The model might have refused the prompt.');
  }
};
