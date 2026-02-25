const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadAudioToCloud = async (recordingId: string, audioBlob: Blob): Promise<string | null> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn("Chưa cấu hình Cloudinary. Bỏ qua bước upload.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", recordingId);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Cloudinary upload failed");
    
    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};