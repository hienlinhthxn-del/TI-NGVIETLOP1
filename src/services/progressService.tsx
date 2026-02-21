import React, { useState, useEffect } from 'react';
import { CheckCircle2, Trophy, Clock, Star } from 'lucide-react';

export interface LessonPartScore {
  main?: number;
  examples?: Record<number, number>;
  passage?: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface ProgressData {
  completedLessons: string[];
  scores: Record<string, number>;
  detailedScores: Record<string, LessonPartScore>;
  lastActivity: string;
  points: number;
  badges: Badge[];
  username: string;
}

const INITIAL_BADGES: Badge[] = [
  { id: 'first_step', name: 'Bước đầu tiên', icon: '🌱', description: 'Hoàn thành bài học đầu tiên', unlocked: false },
  { id: 'star_student', name: 'Học sinh gương mẫu', icon: '⭐', description: 'Đạt điểm 100 trong một bài học', unlocked: false },
  { id: 'dedicated', name: 'Chăm chỉ', icon: '📚', description: 'Hoàn thành 5 bài học', unlocked: false },
  { id: 'master', name: 'Bậc thầy âm vần', icon: '👑', description: 'Hoàn thành 10 bài học', unlocked: false },
];

export const useProgress = () => {
  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('hành-trang-lớp-1-progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        completedLessons: parsed.completedLessons || [],
        scores: parsed.scores || {},
        detailedScores: parsed.detailedScores || {},
        lastActivity: parsed.lastActivity || new Date().toISOString(),
        points: parsed.points || 0,
        badges: parsed.badges || INITIAL_BADGES,
        username: parsed.username || `Bé ${Math.floor(Math.random() * 1000)}`
      };
    }
    return {
      completedLessons: [],
      scores: {},
      detailedScores: {},
      lastActivity: new Date().toISOString(),
      points: 0,
      badges: INITIAL_BADGES,
      username: `Bé ${Math.floor(Math.random() * 1000)}`
    };
  });

  useEffect(() => {
    localStorage.setItem('hành-trang-lớp-1-progress', JSON.stringify(progress));
    
    // Sync with leaderboard
    const syncLeaderboard = async () => {
      try {
        await fetch('/api/leaderboard/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: progress.username,
            points: progress.points,
            lessonsCompleted: progress.completedLessons.length
          })
        });
      } catch (e) {
        console.error("Failed to sync leaderboard", e);
      }
    };
    
    if (progress.points > 0) {
      syncLeaderboard();
    }
  }, [progress]);

  const completeLesson = (lessonId: string, score?: number, part?: string, partIndex?: number) => {
    setProgress(prev => {
      const isNewLesson = !prev.completedLessons.includes(lessonId);
      const newCompleted = isNewLesson 
        ? [...prev.completedLessons, lessonId]
        : prev.completedLessons;
      
      const newScores = { ...prev.scores };
      const newDetailed = { ...prev.detailedScores };
      
      if (!newDetailed[lessonId]) {
        newDetailed[lessonId] = {};
      }

      let pointsEarned = 0;
      if (isNewLesson) pointsEarned += 100;

      if (score !== undefined) {
        if (part === 'main') {
          newDetailed[lessonId].main = Math.max(newDetailed[lessonId].main || 0, score);
        } else if (part === 'passage') {
          newDetailed[lessonId].passage = Math.max(newDetailed[lessonId].passage || 0, score);
        } else if (part === 'example' && partIndex !== undefined) {
          if (!newDetailed[lessonId].examples) newDetailed[lessonId].examples = {};
          newDetailed[lessonId].examples[partIndex] = Math.max(newDetailed[lessonId].examples[partIndex] || 0, score);
        }

        const parts = [];
        if (newDetailed[lessonId].main !== undefined) parts.push(newDetailed[lessonId].main);
        if (newDetailed[lessonId].passage !== undefined) parts.push(newDetailed[lessonId].passage);
        if (newDetailed[lessonId].examples) {
          Object.values(newDetailed[lessonId].examples).forEach(s => parts.push(s));
        }
        
        if (parts.length > 0) {
          const oldScore = newScores[lessonId] || 0;
          const newScore = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
          newScores[lessonId] = newScore;
          
          // Bonus points for score improvement
          if (newScore > oldScore) {
            pointsEarned += (newScore - oldScore);
          }
        }
      }

      // Update badges
      const newBadges = prev.badges.map(badge => {
        if (badge.unlocked) return badge;
        
        let shouldUnlock = false;
        if (badge.id === 'first_step' && newCompleted.length >= 1) shouldUnlock = true;
        if (badge.id === 'star_student' && Object.values(newScores).some(s => s >= 100)) shouldUnlock = true;
        if (badge.id === 'dedicated' && newCompleted.length >= 5) shouldUnlock = true;
        if (badge.id === 'master' && newCompleted.length >= 10) shouldUnlock = true;
        
        if (shouldUnlock) {
          pointsEarned += 50; // Bonus for unlocking badge
          return { ...badge, unlocked: true };
        }
        return badge;
      });

      return {
        ...prev,
        completedLessons: newCompleted,
        scores: newScores,
        detailedScores: newDetailed,
        points: prev.points + pointsEarned,
        badges: newBadges,
        lastActivity: new Date().toISOString()
      };
    });
  };

  const setUsername = (name: string) => {
    setProgress(prev => ({ ...prev, username: name }));
  };

  return { progress, completeLesson, setUsername };
};

export const ProgressDashboard: React.FC<{ progress: ProgressData }> = ({ progress }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setLeaderboard(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [progress.points]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-orange-900">{progress.completedLessons.length}</div>
            <div className="text-xs font-bold text-orange-600 uppercase tracking-widest">Bài đã học</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-900">
              {progress.points}
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Điểm thưởng</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
            <Star size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-green-900">
              {progress.completedLessons.length > 0 
                ? Math.round(Object.values(progress.scores).reduce((a, b) => a + b, 0) / progress.completedLessons.length)
                : 0}%
            </div>
            <div className="text-xs font-bold text-green-600 uppercase tracking-widest">Trung bình</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-yellow-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-yellow-900">
              {progress.badges.filter(b => b.unlocked).length}
            </div>
            <div className="text-xs font-bold text-yellow-600 uppercase tracking-widest">Huy hiệu</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Badges Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Star className="text-yellow-500" /> Huy hiệu của em
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {progress.badges.map(badge => (
              <div key={badge.id} className={`p-4 rounded-2xl border transition-all ${badge.unlocked ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-bold text-slate-900 text-sm">{badge.name}</div>
                <div className="text-xs text-slate-500">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Trophy className="text-indigo-500" /> Bảng xếp hạng
          </h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Đang tải...</div>
            ) : (
              leaderboard.map((player, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl ${player.username === progress.username ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'bg-white border border-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="font-bold text-slate-900">{player.username} {player.username === progress.username && '(Em)'}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-slate-500"><span className="font-bold text-indigo-600">{player.points}</span> điểm</div>
                    <div className="text-slate-400">{player.lessons_completed} bài</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
