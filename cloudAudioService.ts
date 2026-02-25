const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadAudioToCloud = async (recordingId: string, audioBlob: Blob) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error("Cloudinary environment variables are not set.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", recordingId);

  try {
    // 1. Upload lên Cloudinary
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    
    if (data.secure_url) {
      // 2. Lưu link vào MongoDB của mình qua API
      await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId, url: data.secure_url })
      });
      return data.secure_url;
    }
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};

export const getAudioUrl = async (recordingId: string): Promise<string | null> => {
  const res = await fetch(`/api/audio?recordingId=${recordingId}`);
  const data = await res.json();
  return data.url;
};