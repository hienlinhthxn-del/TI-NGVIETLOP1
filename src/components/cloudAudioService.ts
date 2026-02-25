/**
 * Service để tương tác với API audio cho ghi âm của học sinh.
 */

/**
 * Tải file audio blob lên Cloudinary thông qua API của chúng ta.
 * @param recordingId ID duy nhất cho file ghi âm.
 * @param audioBlob Dữ liệu audio dưới dạng Blob.
 */
export const uploadAudioToCloud = async (recordingId: string, audioBlob: Blob): Promise<void> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, `${recordingId}.webm`);

  await fetch(`/api/audio/${recordingId}`, {
    method: 'POST',
    body: formData,
  });
};

/**
 * Lấy URL để phát lại file audio từ Cloudinary.
 * @param recordingId ID của file ghi âm.
 * @returns URL của file audio.
 */
export const getAudioUrl = (recordingId: string): string => {
  // API của chúng ta sẽ redirect đến URL thật của Cloudinary.
  // Trình duyệt sẽ tự động theo dõi redirect này.
  return `/api/audio/${recordingId}`;
};