import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

interface StudentAudioPlayerProps {
  recordingId: string;
}

export function StudentAudioPlayer({ recordingId }: StudentAudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = () => {
    setIsLoading(true);

    // Trên Mobile, play() phải được gọi trực tiếp trong click handler
    const audio = new Audio(`/api/audio/${recordingId}`);

    // Thiết lập các thuộc tính cần thiết cho Mobile
    audio.preload = "auto";

    audio.onplay = () => {
      setIsLoading(false);
    };

    audio.onended = () => {
      setIsLoading(false);
    };

    audio.onerror = (e) => {
      console.error(`Error loading audio from /api/audio/${recordingId}:`, e);
      // Hiển thị chi tiết lỗi nếu có thể
      const errorMsg = audio.error ? ` (Mã lỗi: ${audio.error.code})` : "";
      alert(`Không thể tải bài đọc${errorMsg}. Có thể file đang được xử lý trên máy chủ hoặc do kết nối mạng yếu. Con hãy thử lại sau giây lát nhé!`);
      setIsLoading(false);
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
