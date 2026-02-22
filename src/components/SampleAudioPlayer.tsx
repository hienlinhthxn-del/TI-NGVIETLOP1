import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Loader2, Mic, Square, Trash2 } from 'lucide-react';
import { generateSpeech } from '../services/ttsService';
import { saveCustomAudio, getCustomAudio, deleteCustomAudio } from '../services/customAudioService';

interface SampleAudioPlayerProps {
  text: string | string[];
  label?: string;
  recordingId?: string; // Unique ID for storing custom teacher audio
  isTeacher?: boolean;  // Show recording controls if true
}

export function SampleAudioPlayer({ text, label = "Nghe mẫu", recordingId, isTeacher = false }: SampleAudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasCustomAudio, setHasCustomAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (recordingId) {
      checkCustomAudio();
    }
  }, [recordingId]);

  const checkCustomAudio = async () => {
    if (!recordingId) return;
    const audio = await getCustomAudio(recordingId);
    setHasCustomAudio(!!audio);
  };

  const handlePlay = async () => {
    setIsLoading(true);
    try {
      if (recordingId) {
        const customBlob = await getCustomAudio(recordingId);
        if (customBlob) {
          const url = URL.createObjectURL(customBlob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play();
          setIsLoading(false);
          return;
        }
      }

      const textToSpeak = Array.isArray(text) ? text.join(' ') : text;
      const base64Audio = await generateSpeech(textToSpeak);
      
      // Chuyển đổi Base64 thành Blob (WAV) để trình duyệt tự xử lý
      // Quan trọng: Loại bỏ khoảng trắng/xuống dòng trong chuỗi Base64 để tránh lỗi
      const binaryString = window.atob(base64Audio.replace(/\s/g, ''));
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();

    } catch (err) {
      console.error("Audio Playback Error:", err);
      // Hiển thị lỗi cụ thể cho người dùng
      alert(err instanceof Error ? err.message : "Không thể phát âm thanh");
    }
    setIsLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (recordingId) {
          await saveCustomAudio(recordingId, audioBlob);
          setHasCustomAudio(true);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording Error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDelete = async () => {
    if (recordingId && window.confirm("Xóa giọng đọc mẫu của giáo viên?")) {
      await deleteCustomAudio(recordingId);
      setHasCustomAudio(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        disabled={isLoading || isRecording}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
          hasCustomAudio 
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        }`}
        title={hasCustomAudio ? "Nghe giọng giáo viên" : "Nghe giọng AI"}
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
        {hasCustomAudio ? "Giáo viên" : label}
      </button>

      {isTeacher && recordingId && (
        <div className="flex items-center gap-1">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 animate-pulse"
              title="Dừng ghi âm"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200"
              title="Ghi âm giọng mẫu"
            >
              <Mic size={18} />
            </button>
          )}
          
          {hasCustomAudio && !isRecording && (
            <button
              onClick={handleDelete}
              className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-100 hover:text-red-500"
              title="Xóa giọng mẫu"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
