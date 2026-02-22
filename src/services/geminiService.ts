import { GoogleGenAI, Type } from "@google/genai";

// Lấy API key từ biến môi trường.
// Trong các dự án React hiện đại (Vite, Create React App), các biến môi trường cần có tiền tố.
// - Vite: VITE_
// - Create React App: REACT_APP_

// Sử dụng key dự phòng nếu không tìm thấy biến môi trường
const HARDCODED_KEY = ""; // Nếu file .env không hoạt động, bạn có thể dán trực tiếp API Key vào trong dấu ngoặc kép này.
export const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.REACT_APP_GEMINI_API_KEY : undefined) || HARDCODED_KEY;

export const getGeminiModel = (modelName: string = "gemini-2.0-flash-exp") => {
  if (!apiKey || apiKey.includes("DAN_KEY_CUA_BAN_VAO_DAY")) {
    console.warn("GEMINI_API_KEY chưa được cấu hình đúng.");
    return null;
  }
  const genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

export const analyzeReading = async (audioBase64: string, expectedText: string) => {
  const ai = getGeminiModel("gemini-2.0-flash-exp");
  
  if (!ai) {
    return { 
      transcription: "", 
      feedback: "Chưa cấu hình API Key. Vui lòng kiểm tra cài đặt.", 
      accuracy: 0 
    };
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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
  } catch (error) {
    console.error("Error analyzing reading:", error);
    return { transcription: "", feedback: "Có lỗi khi chấm điểm. Vui lòng thử lại.", accuracy: 0 };
  }
};

export const getQuickHelp = async (question: string) => {
  const ai = getGeminiModel("gemini-2.0-flash-exp");
  if (!ai) return "Chưa cấu hình API Key.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: question,
      config: {
        systemInstruction: "Bạn là một giáo viên tiểu học vui vẻ, chuyên dạy lớp 1. Hãy trả lời các câu hỏi của học sinh hoặc phụ huynh một cách ngắn gọn, dễ hiểu và tràn đầy năng lượng.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting quick help:", error);
    return "Xin lỗi, cô giáo đang bận một chút. Con thử lại sau nhé!";
  }
};
