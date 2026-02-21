import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Trophy, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizProps {
  questions: { question: string; options: string[]; correctAnswer: number }[];
  onComplete: (score: number) => void;
}

export const QuizComponent: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
    } else {
      setShowResult(true);
      onComplete(Math.round((score / questions.length) * 100));
    }
  };

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-orange-50 rounded-3xl border-2 border-orange-200"
      >
        <Trophy className="mx-auto text-orange-500 mb-4" size={64} />
        <h3 className="text-2xl font-bold text-orange-900 mb-2">Hoàn thành bài tập!</h3>
        <p className="text-orange-700 font-medium mb-6">Con đã trả lời đúng {score}/{questions.length} câu hỏi.</p>
        <div className="text-4xl font-black text-orange-600 mb-8">{Math.round((score / questions.length) * 100)}%</div>
      </motion.div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-bold text-orange-600 uppercase tracking-widest">
        <span>Câu hỏi {currentIdx + 1}/{questions.length}</span>
        <span>Điểm: {score}</span>
      </div>
      
      <h3 className="text-xl font-bold text-orange-900 leading-tight">{q.question}</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(i)}
            className={cn(
              "p-4 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between",
              selected === null ? "border-orange-100 hover:border-orange-300 bg-white" :
              i === q.correctAnswer ? "border-green-500 bg-green-50 text-green-700" :
              i === selected ? "border-red-500 bg-red-50 text-red-700" : "border-gray-100 bg-gray-50 opacity-50"
            )}
          >
            {opt}
            {selected !== null && i === q.correctAnswer && <CheckCircle2 size={20} />}
            {selected !== null && i === selected && i !== q.correctAnswer && <XCircle size={20} />}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={nextQuestion}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
          >
            {currentIdx + 1 < questions.length ? "Câu tiếp theo" : "Xem kết quả"}
            <ArrowRight size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
