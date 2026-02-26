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
  completionDates?: Record<string, string>;
}

export interface Assignment {
  id: string;
  lessonId: string;
  timestamp: string;
  message: string;
  dueDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  classId?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
}

const INITIAL_BADGES: Badge[] = [
  { id: 'first_step', name: 'Bước đầu tiên', icon: '🌱', description: 'Hoàn thành bài học đầu tiên', unlocked: false },
  { id: 'star_student', name: 'Học sinh gương mẫu', icon: '⭐', description: 'Đạt điểm 100 trong một bài học', unlocked: false },
  { id: 'dedicated', name: 'Chăm chỉ', icon: '📚', description: 'Hoàn thành 5 bài học', unlocked: false },
  { id: 'master', name: 'Bậc thầy âm vần', icon: '👑', description: 'Hoàn thành 10 bài học', unlocked: false },
];

const DEFAULT_STUDENTS: UserProfile[] = [
  { id: 'hs01', name: 'Hà Tâm An', classId: '1A3' },
  { id: 'hs02', name: 'Vũ Ngọc Khánh An', classId: '1A3' },
  { id: 'hs03', name: 'Hoàng Diệu Anh', classId: '1A3' },
  { id: 'hs04', name: 'Quàng Tuấn Anh', classId: '1A3' },
  { id: 'hs05', name: 'Lê Bảo Châu', classId: '1A3' },
  { id: 'hs06', name: 'Trịnh Công Dũng', classId: '1A3' },
  { id: 'hs07', name: 'Bùi Nhật Duy', classId: '1A3' },
  { id: 'hs08', name: 'Nguyễn Nhật Duy', classId: '1A3' },
  { id: 'hs09', name: 'Nguyễn Phạm Linh Đan', classId: '1A3' },
  { id: 'hs10', name: 'Nguyễn Ngọc Bảo Hân', classId: '1A3' },
  { id: 'hs11', name: 'Mào Trung Hiếu', classId: '1A3' },
  { id: 'hs12', name: 'Nguyễn Bá Gia Hưng', classId: '1A3' },
  { id: 'hs13', name: 'Vừ Gia Hưng', classId: '1A3' },
  { id: 'hs14', name: 'Vừ Thị Ngọc Linh', classId: '1A3' },
  { id: 'hs15', name: 'Đỗ Phan Duy Long', classId: '1A3' },
  { id: 'hs16', name: 'Vừ Thành Long', classId: '1A3' },
  { id: 'hs17', name: 'Vừ Bảo Ly', classId: '1A3' },
  { id: 'hs18', name: 'Quàng Thị Quốc Mai', classId: '1A3' },
  { id: 'hs19', name: 'Vừ Công Minh', classId: '1A3' },
  { id: 'hs20', name: 'Phạm Bảo Ngọc', classId: '1A3' },
  { id: 'hs21', name: 'Lò Thảo Nguyên', classId: '1A3' },
  { id: 'hs22', name: 'Trình Chân Nguyên', classId: '1A3' },
  { id: 'hs23', name: 'Lò Đức Phong', classId: '1A3' },
  { id: 'hs24', name: 'Thào Thị Thảo', classId: '1A3' },
  { id: 'hs25', name: 'Tạ Anh Thư', classId: '1A3' },
  { id: 'hs26', name: 'Lò Minh Tiến', classId: '1A3' },
  { id: 'hs27', name: 'Chang Trí Tuệ', classId: '1A3' },
  { id: 'hs28', name: 'Cà Phương Uyên', classId: '1A3' },
  { id: 'hs29', name: 'Bùi Uyển Vy', classId: '1A3' },
];

export const useProgress = () => {
  // Quản lý danh sách lớp học
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    try {
      const saved = localStorage.getItem('htl1-classes');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [{ id: '1A3', name: 'Lớp 1A3' }];
  });

  // Quản lý danh sách người dùng
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('htl1-users');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return DEFAULT_STUDENTS;
  });

  // ID người dùng hiện tại
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('htl1-current-user-id') || 'default';
  });

  // Hàm tải dữ liệu tiến độ cho một user cụ thể
  const loadProgress = (userId: string, userList: UserProfile[]): ProgressData => {
    const key = `htl1-progress-${userId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.badges) parsed.badges = INITIAL_BADGES;
        return parsed;
      }
    } catch (e) { console.error(e); }

    // Migration: Nếu là user mặc định và chưa có dữ liệu mới, thử tải dữ liệu cũ
    if (userId === 'default') {
      try {
        const oldSaved = localStorage.getItem('hành-trang-lớp-1-progress');
        if (oldSaved) {
          const parsed = JSON.parse(oldSaved);
          return { ...parsed, badges: parsed.badges || INITIAL_BADGES };
        }
      } catch (e) { console.error(e); }
    }

    const user = userList.find(u => u.id === userId);
    return {
      completedLessons: [],
      scores: {},
      detailedScores: {},
      lastActivity: new Date().toISOString(),
      points: 0,
      badges: INITIAL_BADGES,
      username: user ? user.name : 'Bé yêu',
      completionDates: {}
    };
  };

  const [progress, setProgress] = useState<ProgressData>(() => loadProgress(currentUserId, users));

  // Lưu danh sách users khi thay đổi
  useEffect(() => {
    localStorage.setItem('htl1-users', JSON.stringify(users));
  }, [users]);

  // Lưu danh sách lớp khi thay đổi
  useEffect(() => {
    localStorage.setItem('htl1-classes', JSON.stringify(classes));
  }, [classes]);

  // Lưu ID user hiện tại
  useEffect(() => {
    localStorage.setItem('htl1-current-user-id', currentUserId);
  }, [currentUserId]);

  // TẢI DỮ LIỆU TỪ MONGODB KHI CHUYỂN USER
  useEffect(() => {
    const fetchCloudProgress = async () => {
      if (currentUserId === 'default') return;

      try {
        const res = await fetch(`/api/progress?userId=${currentUserId}`);
        if (res.ok) {
          const cloudData = await res.json();
          // Hợp nhất dữ liệu từ cloud về, ưu tiên dữ liệu cloud
          setProgress(prev => ({ ...prev, ...cloudData }));
        }
      } catch (e) {
        console.error("Không thể tải dữ liệu từ cloud:", e);
      }
    };

    fetchCloudProgress();
  }, [currentUserId]);

  // Lưu tiến độ của user hiện tại
  useEffect(() => {
    localStorage.setItem(`htl1-progress-${currentUserId}`, JSON.stringify(progress));

    // Sync with leaderboard
    const syncLeaderboard = async () => {
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: progress.username,
            points: progress.points,
            lessonsCompleted: progress.completedLessons.length
          })
        });
      } catch (e) {
        // console.error("Failed to sync leaderboard", e);
      }
    };

    if (progress.points > 0) {
      syncLeaderboard();
    }

    // ĐỒNG BỘ LÊN MONGODB
    const syncToCloud = async () => {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, ...progress })
        });
      } catch (e) {
        console.error("Lỗi đồng bộ đám mây:", e);
      }
    };

    // Debounce: Đợi 2 giây sau khi thay đổi mới gửi lên server
    const timeoutId = setTimeout(() => {
      if (progress.points > 0) {
        syncToCloud();
      }
    }, 2000);

    return () => clearTimeout(timeoutId); // Hủy timeout nếu component unmount
  }, [progress, currentUserId]);

  const addUser = (name: string, classId?: string) => {
    const newUser = { id: Date.now().toString(), name, classId };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    setCurrentUserId(newUser.id);
    setProgress(loadProgress(newUser.id, newUsers));
  };

  const switchUser = (userId: string) => {
    if (userId === currentUserId) return;
    setCurrentUserId(userId);
    setProgress(loadProgress(userId, users));
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert("Không thể xóa người dùng cuối cùng!");
      return;
    }
    const newUsers = users.filter(u => u.id !== userId);
    setUsers(newUsers);
    localStorage.removeItem(`htl1-progress-${userId}`);

    if (currentUserId === userId) {
      const nextUser = newUsers[0];
      setCurrentUserId(nextUser.id);
      setProgress(loadProgress(nextUser.id, newUsers));
    }
  };

  const addBulkUsers = (names: string[], classId: string) => {
    let newIdCounter = Date.now();
    const newUsersToAdd = names
      .map(name => name.trim().replace(/["\r]/g, ''))
      .filter(name => name && !users.some(u => u.name.toLowerCase() === name.toLowerCase()))
      .map(name => ({ id: (newIdCounter++).toString(), name, classId }));

    if (newUsersToAdd.length > 0) {
      setUsers(prevUsers => [...prevUsers, ...newUsersToAdd]);
    }
    return newUsersToAdd.length;
  };

  const addClass = (className: string) => {
    const newClass = { id: Date.now().toString(), name: className };
    setClasses([...classes, newClass]);
    return newClass.id;
  };

  const completeLesson = (lessonId: string, score?: number, part?: string, partIndex?: number) => {
    setProgress(prev => {
      const isNewLesson = !prev.completedLessons.includes(lessonId);
      const newCompleted = isNewLesson
        ? [...prev.completedLessons, lessonId]
        : prev.completedLessons;

      const newScores = { ...prev.scores };
      const newDetailed = { ...prev.detailedScores };
      const newCompletionDates = { ...(prev.completionDates || {}) };

      if (!newDetailed[lessonId]) {
        newDetailed[lessonId] = {};
      }

      let pointsEarned = 0;
      if (isNewLesson) pointsEarned += 100;

      if (isNewLesson) {
        newCompletionDates[lessonId] = new Date().toISOString();
      }

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
        lastActivity: new Date().toISOString(),
        completionDates: newCompletionDates
      };
    });
  };

  const setUsername = (name: string) => {
    setProgress(prev => ({ ...prev, username: name }));
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, name } : u));
  };

  return { progress, completeLesson, setUsername, users, currentUserId, addUser, switchUser, deleteUser, addBulkUsers, classes, addClass };
};

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem('htl1-assignments');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const assignLesson = (lessonId: string, message: string = "Bài tập về nhà", dueDate?: string) => {
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      lessonId,
      timestamp: new Date().toISOString(),
      message,
      dueDate
    };

    // Kiểm tra xem bài này đã được giao chưa để tránh trùng lặp
    if (!assignments.some(a => a.lessonId === lessonId)) {
      const newAssignments = [newAssignment, ...assignments];
      setAssignments(newAssignments);
      localStorage.setItem('htl1-assignments', JSON.stringify(newAssignments));
      alert("Đã giao bài thành công! Học sinh và phụ huynh sẽ nhận được thông báo.");
    } else {
      alert("Bài học này đã được giao trước đó.");
    }
  };

  // Hàm xóa bài tập (dành cho giáo viên nếu cần - optional)

  return { assignments, assignLesson };
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
        console.error("Không thể tải bảng xếp hạng:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard(); // Tải lần đầu khi component được mount
    const intervalId = setInterval(fetchLeaderboard, 60000); // Tự động làm mới sau mỗi 60 giây

    return () => clearInterval(intervalId); // Dọn dẹp khi component unmount
  }, [progress.points]); // Tải lại khi điểm thay đổi hoặc mỗi 60s

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
