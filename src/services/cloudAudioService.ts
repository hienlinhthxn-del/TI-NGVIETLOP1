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
  if (!UPLOAD_PRESET || UPLOAD_PRESET === "ml_default") {
    console.warn("[Cloudinary] Đang dùng 'ml_default'. Nếu upload thất bại, hãy tạo 'Unsigned Preset' trên Cloudinary và điền vào VITE_CLOUDINARY_PRESET trong file .env");
  }

  formData.append("file", audioBlob, `${recordingId}.${extension}`);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", recordingId);
  formData.append("resource_type", "video"); // Cloudinary treats audio as video

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      let msg = "Upload failed";
      try {
        const errorData = await res.json();
        console.error("[Cloudinary Error]", errorData);
        msg = errorData.error?.message || msg;
      } catch (e) {
        msg = await res.text();
      }

      if (msg.includes("unsigned") || msg.includes("Upload preset")) {
        throw new Error(`Cloudinary chưa được cấu hình đúng. Hãy đảm bảo bạn đã tạo một 'Unsigned Upload Preset' tên là '${UPLOAD_PRESET}' trên Cloudinary dashboard.`);
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