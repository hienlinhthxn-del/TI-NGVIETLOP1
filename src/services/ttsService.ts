import { GoogleGenAI, Modality } from "@google/genai";
import { apiKey } from "./geminiService";

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    if (!apiKey) {
      console.warn("TTS Skipped: API Key is missing");
      return null;
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
      console.warn("TTS Warning: API không trả về âm thanh. Có thể do lỗi Model hoặc Key.", part);
      return null;
    }
    const base64Audio = part.inlineData.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
