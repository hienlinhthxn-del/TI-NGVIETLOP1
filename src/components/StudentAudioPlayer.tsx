import React, { useState, useEffect } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { getStudentAudio } from '../services/customAudioService';

interface StudentAudioPlayerProps {
  recordingId: string;
}

export function StudentAudioPlayer({ recordingId }: StudentAudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    const prepareAudio = async () => {
      try {
        const localBlob = await getStudentAudio(recordingId);
        if (localBlob && isMounted) {
          objectUrl = URL.createObjectURL(localBlob);
          setAudioSrc(objectUrl);
        } else if (isMounted) {
          setAudioSrc(`/api/audio/${recordingId}`);
        }
      } catch (err) {
        if (isMounted) setAudioSrc(`/api/audio/${recordingId}`);
      }
    };

    prepareAudio();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [recordingId]);

  const handlePlay = () => {
    if (!audioSrc) return;
    setIsLoading(true);

    // Tạo Audio và gọi play() ngay lập tức ĐỒNG BỘ trong click handler (quan trọng cho Mobile)
    const audio = new Audio(audioSrc);
    audio.preload = "auto";

    audio.onplay = () => setIsLoading(false);
    audio.onended = () => setIsLoading(false);

    audio.onerror = (e) => {
      console.error(`Error loading audio from ${audioSrc}:`, e);
      // Nếu IDB hỏng hoặc URL lỗi, thử fallback thẳng về API lần cuối
      if (audioSrc.startsWith('blob:')) {
        const fallbackAudio = new Audio(`/api/audio/${recordingId}`);
        fallbackAudio.play().catch(() => { });
      } else {
        const errorMsg = audio.error ? ` (Mã lỗi: ${audio.error.code})` : "";
        alert(`Không thể tải bài đọc${errorMsg}. Có thể do máy chủ chưa lưu kịp hoặc đang mất sóng mạng.`);
      }
      setIsLoading(false);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Playback failed (Autoplay blocked):", error);
        setIsLoading(false);
        if (error.name === 'NotAllowedError') {
          alert("Trình duyệt không cho phép phát tự động. Vui lòng bấm vào màn hình hoặc thử lại nút nghe.");
        }
      });
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading || !audioSrc}
      className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
      title="Nghe bài đọc của học sinh"
    >
      {isLoading || !audioSrc ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
    </button>
  );
}
