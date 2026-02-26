import { GoogleGenAI, Type } from "@google/genai";

// Lấy API key từ biến môi trường.
// Trong các dự án React hiện đại (Vite, Create React App), các biến môi trường cần có tiền tố.
// - Vite: VITE_
// - Create React App: REACT_APP_

// Sử dụng key dự phòng nếu không tìm thấy biến môi trường
const HARDCODED_KEY = ""; // Nếu file .env không hoạt động, bạn có thể dán trực tiếp API Key vào trong dấu ngoặc kép này.
export const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env.REACT_APP_GEMINI_API_KEY : undefined) || HARDCODED_KEY;

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  if (!apiKey || apiKey.includes("DAN_KEY_CUA_BAN_VAO_DAY")) {
    console.warn("GEMINI_API_KEY chưa được cấu hình đúng.");
    return null;
  }
  const genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

export const analyzeReading = async (audioBase64: string, expectedText: string, mimeType: string = "audio/webm") => {
  const genAI = getGeminiModel("gemini-1.5-flash");

  if (!genAI) {
    return {
      transcription: "",
      feedback: "Cô giáo chưa chuẩn bị xong khóa học (Thiếu API Key). Vui lòng báo giáo viên kiểm tra nhé!",
      accuracy: 0
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
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
    ]);

    const response = await result.response;
    const text = response.text() || "{}";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error analyzing reading:", error);
    return { transcription: "", feedback: "Cô chưa nghe rõ, con bấm nút ghi âm và đọc lại cho cô nghe nhé!", accuracy: 0 };
  }
};

export const getQuickHelp = async (question: string) => {
  const genAI = getGeminiModel("gemini-1.5-flash");
  if (!genAI) return "Chưa cấu hình API Key.";

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "Bạn là một giáo viên tiểu học vui vẻ, chuyên dạy lớp 1. Hãy trả lời các câu hỏi của học sinh hoặc phụ huynh một cách ngắn gọn, dễ hiểu và tràn đầy năng lượng.",
    });
    const result = await model.generateContent(question);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting quick help:", error);
    return "Xin lỗi, cô giáo đang bận một chút. Con thử lại sau nhé!";
  }
};
