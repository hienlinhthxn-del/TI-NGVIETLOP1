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
    try {
      const blob = await getStudentAudio(recordingId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      } else {
        alert("Không tìm thấy file ghi âm.");
      }
    } catch (err) {
      console.error("Error playing student audio:", err);
    }
    setIsLoading(false);
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
