// @ts-ignore
const env = import.meta.env || {};
const CLOUD_NAME = env.VITE_CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";
const UPLOAD_PRESET = env.VITE_CLOUDINARY_PRESET || "ml_default";

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

    if (!res.ok) {
      const errorData = await res.json();
      console.error("[Cloudinary Error]", errorData);

      const msg = errorData.error?.message || "Upload failed";
      if (msg.includes("unsigned") || msg.includes("Upload preset")) {
        throw new Error(`Lỗi: 'Upload Preset' ${UPLOAD_PRESET} chưa được cấu hình là 'Unsigned'. Hãy kiểm tra lại dashboard Cloudinary.`);
      }
      throw new Error(msg);
    }

    const data = await res.json();
    console.log("[Cloudinary Success]", data.secure_url);
    return data;
  } catch (e) {
    console.error("Cloudinary Upload Error:", e);
    throw e;
  }
};