import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface WordBuilderProps {
  word: string;
  parts: string[];
  onComplete: (score: number) => void;
}

export const WordBuilder: React.FC<WordBuilderProps> = ({ word, parts, onComplete }) => {
  const [items, setItems] = useState(() => [...parts].sort(() => Math.random() - 0.5));
  const [isCorrect, setIsCorrect] = useState(false);

  const checkResult = (newItems: string[]) => {
    setItems(newItems);
    if (newItems.join('') === word) {
      setIsCorrect(true);
      onComplete(100);
    }
  };

  return (
    <div className="p-8 bg-indigo-50 rounded-3xl border-2 border-indigo-100 text-center">
      <h3 className="text-lg font-bold text-indigo-900 mb-6 flex items-center justify-center gap-2">
        <Sparkles className="text-indigo-500" size={20} />
        Ghép các chữ cái thành từ đúng
      </h3>

      <div className="flex justify-center mb-8">
        <Reorder.Group axis="x" values={items} onReorder={checkResult} className="flex gap-3">
          {items.map((item) => (
            <Reorder.Item
              key={item}
              value={item}
              className="w-16 h-16 bg-white rounded-2xl border-2 border-indigo-200 shadow-sm flex items-center justify-center text-3xl font-black text-indigo-600 cursor-grab active:cursor-grabbing"
            >
              {item}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <AnimatePresence>
        {isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
              <CheckCircle2 size={24} />
              Tuyệt vời! Con đã ghép đúng từ: <span className="text-2xl text-indigo-700 underline underline-offset-4">{word}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isCorrect && (
        <p className="text-indigo-400 text-sm font-medium italic">Kéo thả các ô chữ để thay đổi vị trí nhé!</p>
      )}
    </div>
  );
};
