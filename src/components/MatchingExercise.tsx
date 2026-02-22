import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MatchingPair {
  left: string;
  right: string;
}

interface MatchingExerciseProps {
  data: {
    pairs: MatchingPair[];
  };
  onComplete: (score: number) => void;
}

export const MatchingExercise: React.FC<MatchingExerciseProps> = ({ data, onComplete }) => {
  const [leftItems, setLeftItems] = useState<{id: number, text: string}[]>([]);
  const [rightItems, setRightItems] = useState<{id: number, text: string}[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState<{left: number, right: number} | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const indexedPairs = data.pairs.map((p, i) => ({ ...p, id: i }));
    // Shuffle items
    setLeftItems([...indexedPairs].map(p => ({ id: p.id, text: p.left })).sort(() => Math.random() - 0.5));
    setRightItems([...indexedPairs].map(p => ({ id: p.id, text: p.right })).sort(() => Math.random() - 0.5));
    
    setMatchedIds([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setIsCompleted(false);
  }, [data]);

  const handleLeftClick = (id: number) => {
    if (matchedIds.includes(id) || isCompleted || wrongPair) return;
    if (selectedLeft === id) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(id);
    if (selectedRight !== null) {
      checkMatch(id, selectedRight);
    }
  };

  const handleRightClick = (id: number) => {
    if (matchedIds.includes(id) || isCompleted || wrongPair) return;
    if (selectedRight === id) {
      setSelectedRight(null);
      return;
    }
    setSelectedRight(id);
    if (selectedLeft !== null) {
      checkMatch(selectedLeft, id);
    }
  };

  const checkMatch = (left: number, right: number) => {
    if (left === right) {
      const newMatched = [...matchedIds, left];
      setMatchedIds(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);
      if (newMatched.length === data.pairs.length) {
        setIsCompleted(true);
        onComplete(100);
      }
    } else {
      setWrongPair({ left, right });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 1000);
    }
  };

  if (isCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-green-50 rounded-3xl border-2 border-green-200"
      >
        <Sparkles className="mx-auto text-green-500 mb-4" size={64} />
        <h3 className="text-2xl font-bold text-green-900 mb-2">Hoàn thành xuất sắc!</h3>
        <p className="text-green-700 font-medium">Con đã nối đúng tất cả các cặp từ.</p>
      </motion.div>
    );
  }

  return (
    <div className="p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100">
      <h3 className="text-xl font-bold text-indigo-900 mb-6 flex items-center gap-2">
        <Sparkles className="text-indigo-500" /> Nối từ tương ứng
      </h3>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-3">
          {leftItems.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedLeft === item.id;
            const isWrong = wrongPair?.left === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={!isMatched ? { scale: 1.02 } : {}}
                whileTap={!isMatched ? { scale: 0.98 } : {}}
                onClick={() => handleLeftClick(item.id)}
                disabled={isMatched}
                className={cn(
                  "w-full p-4 rounded-2xl font-bold text-lg transition-all border-2 flex items-center justify-between",
                  isMatched 
                    ? "bg-green-100 border-green-300 text-green-700 opacity-50" 
                    : isWrong
                    ? "bg-red-100 border-red-300 text-red-700"
                    : isSelected
                    ? "bg-indigo-500 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white border-indigo-100 text-indigo-900 hover:border-indigo-300"
                )}
              >
                {item.text}
                {isMatched && <CheckCircle2 size={20} />}
                {isWrong && <XCircle size={20} />}
              </motion.button>
            );
          })}
        </div>

        <div className="space-y-3">
          {rightItems.map((item) => {
            const isMatched = matchedIds.includes(item.id);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongPair?.right === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={!isMatched ? { scale: 1.02 } : {}}
                whileTap={!isMatched ? { scale: 0.98 } : {}}
                onClick={() => handleRightClick(item.id)}
                disabled={isMatched}
                className={cn(
                  "w-full p-4 rounded-2xl font-bold text-lg transition-all border-2 flex items-center justify-between",
                  isMatched 
                    ? "bg-green-100 border-green-300 text-green-700 opacity-50" 
                    : isWrong
                    ? "bg-red-100 border-red-300 text-red-700"
                    : isSelected
                    ? "bg-indigo-500 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white border-indigo-100 text-indigo-900 hover:border-indigo-300"
                )}
              >
                {item.text}
                {isMatched && <CheckCircle2 size={20} />}
                {isWrong && <XCircle size={20} />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};