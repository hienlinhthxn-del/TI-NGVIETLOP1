import { GoogleGenAI, Type } from "@google/genai";

// Lấy API key từ biến môi trường.
// Trong các dự án React hiện đại (Vite, Create React App), các biến môi trường cần có tiền tố.
// - Vite: VITE_
// - Create React App: REACT_APP_

const HARDCODED_KEY = "";
// @ts-ignore
const env = import.meta.env || {};
export const apiKey = env.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY : undefined) || HARDCODED_KEY;

export const getGeminiModel = () => {
  if (!apiKey || apiKey.includes("DAN_KEY_CUA_BAN_VAO_DAY")) {
    console.warn("GEMINI_API_KEY chưa được cấu hình đúng.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeReading = async (audioBase64: string, expectedText: string, mimeType: string = "audio/webm") => {
  const genAI = getGeminiModel();

  if (!genAI) {
    return {
      transcription: "",
      feedback: "Cô giáo chưa chuẩn bị xong khóa học (Thiếu API Key). Vui lòng báo giáo viên kiểm tra nhé!",
      accuracy: 0
    };
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64,
              },
            },
            {
              text: `Bạn là một giáo viên lớp 1 đang chấm điểm tập đọc cho học sinh 6 tuổi. 
            Văn bản mong đợi: "${expectedText}".
            
            Nhiệm vụ:
            1. Phiên âm đoạn âm thanh (transcription).
            2. So sánh với văn bản mong đợi. Nếu học sinh đọc được đại ý hoặc gần đúng các âm cơ bản, hãy chấm điểm cao (trên 70). Chỉ chấm điểm thấp nếu hoàn toàn không có tiếng người hoặc đọc sai toàn bộ.
            3. Đưa ra nhận xét (feedback) cực kỳ ngọt ngào, khen ngợi sự cố gắng của bé, dùng các từ như "Con giỏi quá", "Cố gắng lên nhé", "Cô khen con".
            4. Trả về JSON: { "transcription": string, "feedback": string, "accuracy": number }.
            
            Lưu ý: Chỉ trả về JSON nguyên bản, không dùng dấu nháy ngược code block.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing reading:", error);
    return { transcription: "", feedback: "Cô chưa nghe rõ, con bấm nút ghi âm và đọc lại cho cô nghe nhé!", accuracy: 0 };
  }
};

export const getQuickHelp = async (question: string) => {
  const genAI = getGeminiModel();
  if (!genAI) return "Chưa cấu hình API Key.";

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: question }] }],
      config: {
        systemInstruction: "Bạn là một giáo viên tiểu học vui vẻ, chuyên dạy lớp 1. Hãy trả lời các câu hỏi của học sinh hoặc phụ huynh một cách ngắn gọn, dễ hiểu và tràn đầy năng lượng.",
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, cô chưa rõ ý con.";
  } catch (error) {
    console.error("Error getting quick help:", error);
    return "Xin lỗi, cô giáo đang bận một chút. Con thử lại sau nhé!";
  }
};
