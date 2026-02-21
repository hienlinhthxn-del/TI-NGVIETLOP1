import React, { useState, useRef } from 'react';
import { Mic, Square, Play, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { analyzeReading } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface AudioRecorderProps {
  expectedText: string;
  onFeedback: (feedback: any) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ expectedText, onFeedback }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Không thể truy cập micro. Vui lòng kiểm tra quyền.");
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
    if (!chunksRef.current.length) return;
    
    setIsAnalyzing(true);
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const result = await analyzeReading(base64data, expectedText);
        onFeedback(result);
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-orange-100">
      <div className="text-sm font-medium text-orange-600 uppercase tracking-wider">Luyện đọc cùng AI</div>
      
      <div className="flex items-center gap-4">
        {!isRecording && !audioUrl && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200"
          >
            <Mic size={32} />
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200"
          >
            <Square size={32} />
          </motion.button>
        )}

        {audioUrl && !isRecording && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                const audio = new Audio(audioUrl);
                audio.play();
              }}
              className="px-4 py-2 rounded-full bg-green-500 text-white flex items-center gap-2 font-medium"
            >
              <Play size={20} /> Nghe lại
            </button>
            <button
              onClick={() => {
                setAudioUrl(null);
                chunksRef.current = [];
              }}
              className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 flex items-center gap-2 font-medium"
            >
              <RefreshCw size={20} /> Thử lại
            </button>
          </div>
        )}
      </div>

      {audioUrl && !isRecording && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          disabled={isAnalyzing}
          onClick={handleAnalyze}
          className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white flex items-center gap-2 font-bold shadow-xl shadow-indigo-100 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <RefreshCw className="animate-spin" size={20} />
          ) : (
            <Sparkles size={20} />
          )}
          {isAnalyzing ? "Đang chấm điểm..." : "Chấm điểm bài đọc"}
        </motion.button>
      )}
    </div>
  );
};
