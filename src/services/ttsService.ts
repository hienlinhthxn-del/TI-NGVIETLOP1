import { GoogleGenAI, Modality } from "@google/genai";
import { apiKey } from "./geminiService";

export async function generateSpeech(text: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("Chưa có API Key. Vui lòng tạo file .env và thêm VITE_GEMINI_API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: `Đọc to và rõ ràng: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' }, // Aoede thường tự nhiên hơn cho giọng nữ/trẻ em
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) {
      throw new Error("Google AI không trả về âm thanh. Kiểm tra lại Model hoặc Key.");
    }
    const base64Audio = part.inlineData.data;
    return base64Audio;
  } catch (error: any) {
    console.error("TTS Error:", error);
    throw new Error(error.message || "Lỗi tạo giọng đọc AI");
  }
}
