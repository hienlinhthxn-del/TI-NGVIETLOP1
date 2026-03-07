// Lấy cấu hình từ biến môi trường
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "ml_default"; // Bạn cần tạo Unsigned Preset trên Cloudinary

/**
 * Upload audio blob lên Cloudinary
 * @param recordingId ID duy nhất của file ghi âm (vd: student-hs01-lesson1-main)
 * @param audioBlob File âm thanh dạng Blob
 * @param extension Phần mở rộng (webm, mp4, etc)
 */
export const uploadAudioToCloud = async (recordingId: string, audioBlob: Blob, extension: string = "webm") => {
  const formData = new FormData();
  formData.append("file", audioBlob, `${recordingId}.${extension}`);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", recordingId);
  formData.append("resource_type", "video"); // Cloudinary thường xử lý audio qua API video/raw

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Cloudinary Upload Error:", e);
    throw e;
  }
};