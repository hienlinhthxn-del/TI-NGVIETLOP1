import React, { useState, useRef } from 'react';
import { Mic, Square, Play, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { analyzeReading } from '../services/geminiService';
import { saveStudentAudio } from '../services/customAudioService';
import { motion, AnimatePresence } from 'motion/react';

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
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
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
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const textToAnalyze = Array.isArray(expectedText) ? expectedText.join(' ') : expectedText;
        const result = await analyzeReading(base64data, textToAnalyze);
        
        if (recordingId) {
          await saveStudentAudio(recordingId, audioBlob);
        }

        setFeedback(result);
        if (onFeedback) onFeedback(result, audioBlob);
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error("Analysis failed:", error);
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
