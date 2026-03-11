import React, { useState, useRef } from 'react';
import { Mic, Square, Play, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { analyzeReading } from '../services/geminiService';
import { uploadAudioToCloud } from '../services/cloudAudioService'; // Đảm bảo import đúng
import { saveStudentAudio } from '../services/customAudioService';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentAudioRecorderProps {
  expectedText: string | string[];
  onFeedback?: (feedback: any, audioBlob: Blob) => void;
  recordingId?: string;
}

export function StudentAudioRecorder({ expectedText, onFeedback, recordingId }: StudentAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Xác định mimeType hỗ trợ
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac'];
      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || supportedType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      // Đưa khoảng thời gian ghi âm (timeslice) vào start() giúp một số browser mobile ổn định hơn (vd: 1000ms)
      mediaRecorder.start(1000);
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập trên trình duyệt của con nhé!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAnalyze = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);
    setFeedback(null);

    // helper that persists the recording regardless of analysis outcome
    const persist = () => {
      if (!recordingId) return;
      const extension = audioBlob.type.includes('mp4') ? 'mp4' :
        audioBlob.type.includes('ogg') ? 'ogg' :
        audioBlob.type.includes('mpeg') ? 'mp3' : 'webm';

      console.log(`[Upload] Starting (background): ${recordingId}.${extension}`);
      saveStudentAudio(recordingId, audioBlob).catch(e => console.error("Local save error:", e));
      uploadAudioToCloud(recordingId, audioBlob, extension)
        .then(() => console.log(`[Upload] Successfully saved: ${recordingId}`))
        .catch(err => {
          console.error("[Upload] Failed to save audio:", err);
          alert("Bạn đang dùng ở chế độ ngoại tuyến (Offline) hoặc máy chủ đang bận. Điểm số của con đã được lưu lại, nhưng file ghi âm có thể không được tải lên máy chủ của cô giáo.");
        });
    };

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const textToAnalyze = Array.isArray(expectedText) ? expectedText.join(' ') : expectedText;

        // 1. Phân tích AI - Quan trọng nhất nên chạy trước
        let result;
        try {
          result = await analyzeReading(base64data, textToAnalyze, audioBlob.type);
        } catch (err: any) {
          console.error("Analysis failed:", err);
          result = { accuracy: 0, feedback: "Cô chưa nghe rõ, con bấm nút ghi âm và đọc lại cho cô nghe nhé!" };
        }

        setFeedback(result);

        // dù thế nào cũng thông báo cho cha mẹ/ứng dụng
        if (onFeedback) {
          onFeedback(result, audioBlob);
        }

        persist();
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error("Handle analyze error:", error);
      const fallback = { accuracy: 0, feedback: "Lỗi khi xử lý âm thanh." };
      setFeedback(fallback);
      if (onFeedback) onFeedback(fallback, audioBlob);
      persist();
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {!isRecording && !audioUrl && (
          <button
            onClick={startRecording}
            className="p-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors"
            title="Ghi âm bài đọc"
          >
            <Mic size={18} />
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 animate-pulse"
            title="Dừng ghi âm"
          >
            <Square size={18} />
          </button>
        )}

        {audioUrl && !isRecording && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                const audio = new Audio(audioUrl);
                audio.play();
              }}
              className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200"
              title="Nghe lại"
            >
              <Play size={18} />
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              title="Chấm điểm"
            >
              {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
            <button
              onClick={() => {
                setAudioUrl(null);
                setFeedback(null);
                chunksRef.current = [];
              }}
              className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"
              title="Thử lại"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs p-2 bg-indigo-50 rounded-lg border border-indigo-100"
          >
            <div className="font-bold text-indigo-700">Kết quả: {feedback.accuracy}%</div>
            <div className="text-gray-600 italic mt-1">{feedback.feedback}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
