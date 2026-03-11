import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Loader2, Mic, Square, Trash2, Upload } from 'lucide-react';
import { saveCustomAudio, getCustomAudio, deleteCustomAudio } from '../services/customAudioService';
import { generateSpeech } from '../services/ttsService';
import { uploadAudioToCloud } from '../services/cloudAudioService';

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
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (recordingId) {
      checkCustomAudio(isMounted);
    }

    return () => {
      isMounted = false;
      if (customAudioUrl && customAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customAudioUrl);
      }
    };
  }, [recordingId]);

  // Tải danh sách giọng đọc của trình duyệt
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const checkCustomAudio = async (isMounted: boolean = true) => {
    if (!recordingId) return;
    try {
      // 1. Ưu tiên lấy từ IndexedDB (local)
      const localAudio = await getCustomAudio(recordingId);
      if (localAudio && isMounted) {
        if (customAudioUrl && customAudioUrl.startsWith('blob:')) URL.revokeObjectURL(customAudioUrl);
        const newUrl = URL.createObjectURL(localAudio);
        setCustomAudioUrl(newUrl);
        setHasCustomAudio(true);
        return;
      }

      // 2. Nếu không có ở local, thử tải từ cloud
      const cloudUrl = `/api/audio/${recordingId}`;
      const response = await fetch(cloudUrl);

      if (response.ok && isMounted) {
        const cloudBlob = await response.blob();
        const newUrl = URL.createObjectURL(cloudBlob);
        setCustomAudioUrl(newUrl);
        setHasCustomAudio(true);
      } else {
        if (!isMounted) return;
        setHasCustomAudio(false);
        setCustomAudioUrl(null);
      }
    } catch (e) {
      if (!isMounted) return;
      console.warn("Could not find custom audio locally or on cloud for " + recordingId);
    }
  };

  const speakText = async (textToSpeak: string) => {
    setIsLoading(true);

    // 1. Thử sử dụng Google Gemini TTS (Chất lượng cao, ổn định trên Mobile)
    try {
      const base64Audio = await generateSpeech(textToSpeak);
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.onended = () => setIsLoading(false);
        audio.onerror = () => {
          fallbackToSpeechSynthesis(textToSpeak);
        };
        await audio.play();
        return;
      }
    } catch (e) {
      console.warn("Gemini TTS failed, falling back to browser TTS:", e);
    }

    // 2. Fallback sang trình duyệt (SpeechSynthesis)
    fallbackToSpeechSynthesis(textToSpeak);
  };

  const fallbackToSpeechSynthesis = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      setIsLoading(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) utterance.voice = viVoice;

    utterance.onend = () => setIsLoading(false);
    utterance.onerror = () => setIsLoading(false);
    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    setIsLoading(true);

    // [BƯỚC QUAN TRỌNG CHO IOS]: Unlock audio synchronously trong lúc user click
    // Mở khoá Audio Context:
    const unlockAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    unlockAudio.play().then(() => unlockAudio.pause()).catch(() => { });

    // Mở khoá Speech Synthesis (nếu fallback):
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }

    // 1. Ưu tiên giọng giáo viên nếu có
    if (customAudioUrl) {
      const audio = new Audio(customAudioUrl);
      audio.onended = () => setIsLoading(false);
      audio.onerror = () => {
        const textToSpeak = Array.isArray(text) ? text.join(' ') : text;
        speakText(textToSpeak);
      };
      audio.play().catch(err => {
        console.error("Custom audio play failed:", err);
        const textToSpeak = Array.isArray(text) ? text.join(' ') : text;
        speakText(textToSpeak);
      });
      return;
    }

    // 2. Sử dụng AI Voice
    const textToSpeak = Array.isArray(text) ? text.join(' ') : text;
    speakText(textToSpeak);
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
          // Lưu local để phát ngay, và tải lên cloud cho thiết bị khác
          await saveCustomAudio(recordingId, audioBlob);
          await checkCustomAudio(); // Cập nhật lại state từ local blob

          const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
          uploadAudioToCloud(recordingId, audioBlob, extension)
            .then(() => console.log(`[Teacher Audio] Uploaded ${recordingId}`))
            .catch(err => {
              console.error(`[Teacher Audio] Upload failed for ${recordingId}`, err);
              alert("Lỗi tải lên giọng đọc của giáo viên. Học sinh ở máy khác có thể không nghe được.");
            });
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
      // Xóa ở local
      await deleteCustomAudio(recordingId);
      setHasCustomAudio(false);
      setCustomAudioUrl(null);
      // TODO: Gửi yêu cầu lên server để xóa file trên cloud
      // Ví dụ: await fetch(`/api/audio/${recordingId}`, { method: 'DELETE' });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && recordingId) {
      // Lưu local và tải lên cloud
      await saveCustomAudio(recordingId, file);
      await checkCustomAudio(); // Cập nhật state

      const extension = file.name.split('.').pop() || 'mp3';
      uploadAudioToCloud(recordingId, file, extension)
        .then(() => console.log(`[Teacher Audio] Uploaded ${recordingId} from file.`))
        .catch(err => {
          console.error(`[Teacher Audio] Upload failed for ${recordingId}`, err);
          alert("Lỗi tải lên giọng đọc của giáo viên. Học sinh ở máy khác có thể không nghe được.");
        });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        disabled={isLoading || isRecording}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${hasCustomAudio
          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
        title={hasCustomAudio ? "Nghe giọng giáo viên (Đã sửa)" : "Nghe giọng AI"}
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
            <>
              <button
                onClick={startRecording}
                className="p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200"
                title="Ghi âm giọng mẫu"
              >
                <Mic size={18} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200"
                title="Tải lên file ghi âm"
              >
                <Upload size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="audio/*"
                className="hidden"
              />
            </>
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
