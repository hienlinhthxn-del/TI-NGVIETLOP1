import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { getStudentAudio } from '../services/customAudioService';

interface StudentAudioPlayerProps {
  recordingId: string;
}

export function StudentAudioPlayer({ recordingId }: StudentAudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    setIsLoading(true);

    let audioSrc = `/api/audio/${recordingId}`;

    // Thử lấy từ IndexedDB để nghe lại trực tiếp (ngay cả khi offline hoặc Cloudinary lỗi)
    try {
      const localAudioBlob = await getStudentAudio(recordingId);
      if (localAudioBlob) {
        audioSrc = URL.createObjectURL(localAudioBlob);
      }
    } catch (e) {
      console.warn("Could not find local audio, falling back to Cloudinary:", e);
    }

    // Trên Mobile, play() phải được gọi trực tiếp trong click handler
    const audio = new Audio(audioSrc);

    // Thiết lập các thuộc tính cần thiết cho Mobile
    audio.preload = "auto";

    audio.onplay = () => {
      setIsLoading(false);
    };

    audio.onended = () => {
      setIsLoading(false);
      // Giải phóng URL nếu đã tạo từ Blob
      if (audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }
    };

    audio.onerror = (e) => {
      console.error(`Error loading audio from ${audioSrc}:`, e);
      // Hiển thị chi tiết lỗi nếu có thể
      const errorMsg = audio.error ? ` (Mã lỗi: ${audio.error.code})` : "";
      alert(`Không thể tải bài đọc${errorMsg}. Có thể file đang được xử lý trên máy chủ hoặc do kết nối mạng yếu. Con hãy thử lại sau giây lát nhé!`);
      setIsLoading(false);
      if (audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }
    };

    // Gọi play ngay lập tức
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Playback failed:", error);
        setIsLoading(false);
        // Alert nếu bị chặn do auto-play
        if (error.name === 'NotAllowedError') {
          alert("Vui lòng nhấn nút phát âm thanh một lần nữa nhé!");
        }
      });
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
      title="Nghe bài đọc của học sinh"
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
    </button>
  );
}
