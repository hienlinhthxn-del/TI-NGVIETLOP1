import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview") => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

export const analyzeReading = async (audioBase64: string, expectedText: string) => {
  const ai = getGeminiModel("gemini-3-flash-preview");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64,
            },
          },
          {
            text: `Đây là bản ghi âm của một học sinh lớp 1 đang tập đọc. Văn bản mong đợi là: "${expectedText}". 
            Hãy phiên âm những gì học sinh đã đọc và so sánh với văn bản mong đợi. 
            Sau đó, đưa ra nhận xét khích lệ bằng tiếng Việt, chỉ ra những từ đọc đúng và những từ cần luyện tập thêm.
            Trả về kết quả dưới dạng JSON với cấu trúc: { "transcription": string, "feedback": string, "accuracy": number (0-100) }`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}");
};

export const getQuickHelp = async (question: string) => {
  const ai = getGeminiModel("gemini-2.5-flash-lite-latest");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite-latest",
    contents: question,
    config: {
      systemInstruction: "Bạn là một giáo viên tiểu học vui vẻ, chuyên dạy lớp 1. Hãy trả lời các câu hỏi của học sinh hoặc phụ huynh một cách ngắn gọn, dễ hiểu và tràn đầy năng lượng.",
    }
  });
  return response.text;
};
