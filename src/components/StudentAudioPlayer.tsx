import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

interface StudentAudioPlayerProps {
  recordingId: string;
}

export function StudentAudioPlayer({ recordingId }: StudentAudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = () => {
    setIsLoading(true);
    // API route này sẽ chuyển hướng đến file audio thực tế trên Cloudinary
    const audio = new Audio(`/api/audio/${recordingId}`);
    
    const cleanup = () => {
      audio.oncanplaythrough = null;
      audio.onended = null;
      audio.onerror = null;
    };

    audio.oncanplaythrough = () => {
      audio.play().catch(e => {
        console.error("Audio play failed", e);
        setIsLoading(false);
        cleanup();
      });
    };

    audio.onended = () => {
      setIsLoading(false);
      cleanup();
    };

    audio.onerror = () => {
      console.error(`Error loading audio from /api/audio/${recordingId}`);
      alert("Không thể tải bài đọc của học sinh.");
      setIsLoading(false);
      cleanup();
    };
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
