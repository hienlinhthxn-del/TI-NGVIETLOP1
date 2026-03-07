import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Layout, ChevronRight, Star, Home, CheckCircle2, Trophy, Users, Baby, Lock, ArrowLeft, BarChart3, Settings, Plus, RefreshCw, Trash2, Check, Sparkles, Bell, Calendar, X, Download, Upload, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lessons as staticLessons, Lesson } from './data/lessons';
import { QuizComponent } from './components/QuizComponent';
import { WordBuilder } from './components/WordBuilder';
import { SampleAudioPlayer } from './components/SampleAudioPlayer';
import { StudentAudioRecorder } from './components/StudentAudioRecorder';
import { StudentAudioPlayer } from './components/StudentAudioPlayer';
import { MatchingExercise } from './components/MatchingExercise';
import { useProgress, useAssignments, ProgressDashboard, type ProgressData, type Assignment, type UserProfile, type ClassGroup } from './services/progressService';
import { AuthScreen } from './components/AuthScreen';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'student' | 'teacher' | 'parent' | null;

export default function App() {
  const [role, setRole] = useState<Role>(null);
  const [activeTab, setActiveTab] = useState<'tap1' | 'tap2'>('tap1');
  const [teacherView, setTeacherView] = useState<'lessons' | 'dashboard'>('lessons');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>(staticLessons);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [aiFeedback, setAiFeedback] = useState<{ transcription: string; feedback: string; accuracy: number } | null>(null);
  const { progress, completeLesson, setUsername, users, currentUserId, addUser, switchUser, deleteUser, addBulkUsers, classes, addClass, resetToDefault, login, register, logout } = useProgress();
  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState(progress.username);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const { assignments, assignLesson } = useAssignments();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setIsLoadingLessons(true);
      const res = await fetch('/api/lessons');
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (error) {
      console.error("Failed to fetch lessons", error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleUpdateLesson = async (id: string, updates: Partial<Lesson>) => {
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      if (res.ok) {
        const updated = await res.json();
        setLessons(prev => prev.map(l => l.id === id ? updated : l));
        setSelectedLesson(updated);
        setIsEditing(false);
        alert("Cập nhật bài học thành công!");
      }
    } catch (error) {
      alert("Lỗi khi cập nhật bài học");
    }
  };

  const filteredLessons = lessons.filter(l =>
    activeTab === 'tap1' ? l.book === 1 : l.book === 2
  );

  const handleLogin = (selectedRole: Role, userData: any) => {
    setRole(selectedRole);
    // After login, we update the role in App state
    // The progress is already updated inside useProgress.login
  };

  const handleLogout = () => {
    setRole(null);
    setSelectedLesson(null);
    // useProgress.logout is handled if needed
  };

  if (!role) {
    return <AuthScreen onLogin={handleLogin} loginService={login} registerService={register} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D2D2D] font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-colors flex items-center gap-2 group">
            <ArrowLeft size={24} />
            <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Đổi vai trò / Đăng xuất</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Notification Bell for Student and Parent */}
          {(role === 'student' || role === 'parent') && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-colors relative"
              >
                <Bell size={24} />
                {assignments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                    {assignments.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-orange-100 p-4 z-50">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Bell size={16} className="text-orange-500" /> Thông báo từ giáo viên</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {assignments.length === 0 ? <p className="text-sm text-slate-400 italic">Chưa có thông báo mới.</p> : assignments.map(a => {
                        const l = lessons.find(ls => ls.id === a.lessonId);
                        return <div key={a.id} className="text-sm p-3 bg-orange-50 rounded-xl border border-orange-100"><div className="font-bold text-orange-800">{a.message}</div><div className="text-slate-600">Bài: {l?.title}</div><div className="text-xs text-slate-400 mt-1">{new Date(a.timestamp).toLocaleDateString('vi-VN')}</div></div>
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {role === 'student' && (
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Điểm của em</span>
                <span className="text-lg font-black text-indigo-600 leading-none">{progress.points}</span>
              </div>
              <Trophy size={20} className="text-indigo-500" />
            </div>
          )}

          {role === 'student' && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors relative group"
            >
              <Settings size={24} />
              <span className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Tài khoản</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
              role === 'student' ? "bg-blue-500" : role === 'teacher' ? "bg-emerald-500" : "bg-orange-500")}>
              {role === 'student' ? <Baby size={24} /> : role === 'teacher' ? <GraduationCap size={24} /> : <Users size={24} />}
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                {role === 'student' ? progress.username : role === 'teacher' ? 'Bảng Giáo Viên' : 'Góc Phụ Huynh'}
              </h1>
              {role === 'student' && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học sinh lớp 1A</span>}
            </div>
          </div>
        </div>
        {(role === 'student' || (role === 'teacher' && teacherView === 'lessons')) && (
          <nav className="hidden md:flex items-center gap-1 bg-orange-50 p-1 rounded-2xl">
            <TabBtn active={activeTab === 'tap1'} onClick={() => { setActiveTab('tap1'); setSelectedLesson(null); }}>Tập 1</TabBtn>
            <TabBtn active={activeTab === 'tap2'} onClick={() => { setActiveTab('tap2'); setSelectedLesson(null); }}>Tập 2</TabBtn>
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Quản lý tài khoản</h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">✕</button>
                </div>

                <div className="space-y-6">
                  {/* Đổi tên user hiện tại */}
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Đang học: {progress.username}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="flex-1 px-4 py-2 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                        placeholder="Đổi tên..."
                      />
                      <button
                        onClick={() => { setUsername(newUsername); alert("Đã đổi tên thành công!"); }}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Danh sách users */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-700">Danh sách học sinh</h3>
                      <button
                        onClick={() => setIsAddingUser(!isAddingUser)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> Thêm mới
                      </button>
                    </div>

                    {isAddingUser && (
                      <div className="mb-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <input
                          type="text"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="Tên học sinh mới..."
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (newProfileName.trim()) {
                              addUser(newProfileName.trim());
                              setNewProfileName('');
                              setIsAddingUser(false);
                            }
                          }}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600"
                        >
                          Thêm
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {users.map(user => (
                        <div key={user.id} className={cn("flex items-center justify-between p-3 rounded-xl border transition-all",
                          user.id === currentUserId ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100 hover:border-indigo-200")}>
                          <button
                            onClick={() => switchUser(user.id)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              user.id === currentUserId ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500")}>
                              {user.name[0].toUpperCase()}
                            </div>
                            <span className={cn("font-bold text-sm", user.id === currentUserId ? "text-indigo-900" : "text-slate-600")}>
                              {user.name} {user.id === currentUserId && "(Em)"}
                            </span>
                          </button>

                          {users.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm(`Xóa học sinh ${user.name}?`)) deleteUser(user.id); }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Nút Cập nhật danh sách mẫu cho HS */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <button
                        onClick={resetToDefault}
                        className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles size={18} className="text-red-500" /> Cập nhật danh sách lớp từ hệ thống
                      </button>
                      <p className="text-[10px] text-slate-400 mt-2 text-center italic">Sử dụng nút này nếu em không thấy tên mình trong danh sách.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {role === 'student' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-50">
                <h2 className="text-lg font-bold text-orange-900 mb-4">{activeTab === 'tap1' ? '83 Bài Âm Vần' : 'Chủ đề Tập Đọc'}</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredLessons.map((lesson) => (
                    <button key={lesson.id} onClick={() => { setSelectedLesson(lesson); setAiFeedback(null); }}
                      className={cn("w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group",
                        selectedLesson?.id === lesson.id ? "bg-orange-500 text-white shadow-lg" : "bg-white hover:bg-orange-50")}>
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-bold uppercase opacity-70", selectedLesson?.id === lesson.id ? "text-white" : "text-orange-600")}>
                          {lesson.type === 'vowel' ? 'Âm' : lesson.type === 'rhyme' ? 'Vần' : 'Bài đọc'}
                        </span>
                        <span className="font-bold text-sm">{lesson.title}</span>
                      </div>
                      <ChevronRight size={18} className={cn("transition-transform", selectedLesson?.id === lesson.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedLesson ? (
                  <LessonContent
                    lesson={selectedLesson}
                    progress={progress}
                    onFeedback={(f) => { setAiFeedback(f); completeLesson(selectedLesson.id, f.accuracy); }}
                    aiFeedback={aiFeedback}
                    completeLesson={completeLesson}
                    role={role}
                    assignLesson={assignLesson}
                    assignments={assignments}
                    currentUserId={currentUserId}
                  />
                ) : (
                  <WelcomeBox />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {role === 'student' && (
          <div className="mt-12">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Trophy className="text-indigo-500" /> Thành tích & Bảng xếp hạng
            </h2>
            <ProgressDashboard progress={progress} />
          </div>
        )}

        {role === 'teacher' && (
          <>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
              <button onClick={() => setTeacherView('lessons')} className={cn('py-3 px-4 font-bold', teacherView === 'lessons' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500')}>
                Nội dung bài học
              </button>
              <button onClick={() => setTeacherView('dashboard')} className={cn('py-3 px-4 font-bold', teacherView === 'dashboard' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500')}>
                Bảng điều khiển lớp
              </button>
            </div>

            {teacherView === 'lessons' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-50">
                    <h2 className="text-lg font-bold text-orange-900 mb-4">{activeTab === 'tap1' ? '83 Bài Âm Vần' : 'Chủ đề Tập Đọc'}</h2>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredLessons.map((lesson) => (
                        <button key={lesson.id} onClick={() => { setSelectedLesson(lesson); setAiFeedback(null); }}
                          className={cn("w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group",
                            selectedLesson?.id === lesson.id ? "bg-orange-500 text-white shadow-lg" : "bg-white hover:bg-orange-50")}>
                          <div className="flex flex-col">
                            <span className={cn("text-xs font-bold uppercase opacity-70", selectedLesson?.id === lesson.id ? "text-white" : "text-orange-600")}>{lesson.type === 'vowel' ? 'Âm' : lesson.type === 'rhyme' ? 'Vần' : 'Bài đọc'}</span>
                            <span className="font-bold text-sm">{lesson.title}</span>
                          </div>
                          <ChevronRight size={18} className={cn("transition-transform", selectedLesson?.id === lesson.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    {selectedLesson ? (
                      isEditing ? (
                        <LessonEditor lesson={selectedLesson} onSave={handleUpdateLesson} onCancel={() => setIsEditing(false)} />
                      ) : (
                        <LessonContent lesson={selectedLesson} progress={progress} onFeedback={(f) => { setAiFeedback(f); completeLesson(selectedLesson.id, f.accuracy); }} aiFeedback={aiFeedback} completeLesson={completeLesson} role={role} assignLesson={assignLesson} assignments={assignments} currentUserId={currentUserId} onEdit={() => setIsEditing(true)} />
                      )
                    ) : (
                      <WelcomeBox />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : <TeacherDashboard progress={progress} users={users} addUser={addUser} addBulkUsers={addBulkUsers} classes={classes} onAddClass={addClass} onReset={resetToDefault} lessons={lessons} />}
          </>
        )}
        {role === 'parent' && <ParentDashboard users={users} classes={classes} lessons={lessons} currentUserId={currentUserId} />}
      </main>
    </div>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: 'blue' | 'emerald' | 'orange';
  onClick: () => void;
  locked?: boolean;
}

function RoleCard({ icon, title, desc, color, onClick, locked }: RoleCardProps) {
  return (
    <motion.button whileHover={{ y: -8 }} onClick={onClick} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group relative">
      {locked && <div className="absolute top-6 right-6 text-slate-300"><Lock size={20} /></div>}
      <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform",
        color === 'blue' ? "bg-blue-50 text-blue-500" : color === 'emerald' ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500")}>
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-400 font-medium">{desc}</p>
    </motion.button>
  );
}

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabBtn({ active, onClick, children }: TabBtnProps) {
  return (
    <button onClick={onClick} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", active ? "bg-white text-orange-600 shadow-sm" : "text-orange-900/60 hover:text-orange-600")}>
      {children}
    </button>
  );
}

interface LessonContentProps {
  lesson: Lesson;
  progress: ProgressData;
  onFeedback: (feedback: any) => void;
  aiFeedback: any;
  completeLesson: (id: string, score?: number, part?: string, index?: number) => void;
  role: Role;
  assignLesson: (id: string, message?: string, dueDate?: string) => void;
  assignments: Assignment[];
  currentUserId: string;
}

function LessonContent({ lesson, progress, onFeedback, aiFeedback, completeLesson, role, assignLesson, assignments, currentUserId, onEdit }: LessonContentProps & { onEdit?: () => void }) {
  const isTeacher = role === 'teacher';
  const isAssigned = assignments.some(a => a.lessonId === lesson.id);
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <motion.div key={lesson.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-orange-50 min-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-widest">{lesson.book === 1 ? 'Tập 1' : 'Tập 2'}</span>
          {isAssigned && <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1"><Bell size={12} /> Bài tập về nhà</span>}
          {lesson.topic && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{lesson.topic}</span>}
        </div>
        <div className="flex items-center gap-2">
          {isTeacher && onEdit && (
            <button onClick={onEdit} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center gap-2 font-bold text-xs">
              <Settings size={16} /> Sửa nội dung
            </button>
          )}
          {progress.completedLessons.includes(lesson.id) && <div className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle2 size={16} /> Đã xong</div>}
        </div>
      </div>
      <h2 className="text-4xl md:text-5xl font-black text-orange-900 mb-8 tracking-tight">{lesson.title}</h2>
      <div className="flex-grow space-y-12">
        {lesson.book === 1 && lesson.content && (
          <div className="flex flex-col items-center justify-center p-12 bg-orange-50/50 rounded-[2rem] border-2 border-dashed border-orange-200">
            <div className="text-8xl md:text-9xl font-black text-orange-600 drop-shadow-sm">{lesson.content}</div>
            <p className="mt-4 text-orange-900/50 font-medium italic mb-6">Hãy cùng đọc to nhé!</p>
            <div className="flex items-center gap-3">
              <SampleAudioPlayer
                text={lesson.content}
                label="Nghe mẫu âm/vần"
                recordingId={`${lesson.id}-main`}
                isTeacher={isTeacher}
              />
              {!isTeacher && (
                <StudentAudioRecorder
                  expectedText={lesson.content}
                  recordingId={`student-${currentUserId}-${lesson.id}-main`}
                  onFeedback={(f) => completeLesson(lesson.id, f.accuracy, 'main')}
                />
              )}
            </div>
          </div>
        )}

        {lesson.examples && lesson.examples.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lesson.examples.map((ex: string, i: number) => (
              <div key={i} className="bg-white border border-orange-100 p-4 rounded-2xl flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-2xl font-bold text-orange-800">{ex}</span>
                <div className="flex flex-col items-center gap-2">
                  <SampleAudioPlayer
                    text={ex}
                    label="Nghe"
                    recordingId={`${lesson.id}-ex-${i}`}
                    isTeacher={isTeacher}
                  />
                  {!isTeacher && (
                    <StudentAudioRecorder
                      expectedText={ex}
                      recordingId={`student-${currentUserId}-${lesson.id}-ex-${i}`}
                      onFeedback={(f) => completeLesson(lesson.id, f.accuracy, 'example', i)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {lesson.passage && (
          <div className="p-8 bg-white border-2 border-orange-100 rounded-3xl shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Đoạn văn luyện đọc</h3>
              <div className="flex items-center gap-3">
                <SampleAudioPlayer
                  text={lesson.passage}
                  recordingId={`${lesson.id}-passage`}
                  isTeacher={isTeacher}
                />
                {!isTeacher && (
                  <StudentAudioRecorder
                    expectedText={lesson.passage}
                    recordingId={`student-${currentUserId}-${lesson.id}-passage`}
                    onFeedback={(f) => completeLesson(lesson.id, f.accuracy, 'passage')}
                  />
                )}
              </div>
            </div>
            <div className="text-2xl md:text-3xl leading-relaxed font-medium text-gray-800 text-center space-y-4">
              {Array.isArray(lesson.passage) ? (
                lesson.passage.map((line, i) => (
                  <p key={i}>{line}</p>
                ))
              ) : (
                <p>{lesson.passage}</p>
              )}
            </div>
          </div>
        )}

        {lesson.exercise && (
          <div className="mt-8">
            {lesson.exercise.type === 'word-builder' && <WordBuilder word={lesson.exercise.data.word} parts={lesson.exercise.data.parts} onComplete={(score) => completeLesson(lesson.id, score)} />}
            {lesson.exercise.type === 'fill-blank' && <FillBlankExercise data={lesson.exercise.data} onComplete={(score) => completeLesson(lesson.id, score)} />}
            {lesson.exercise.type === 'matching' && <MatchingExercise data={lesson.exercise.data} onComplete={(score) => completeLesson(lesson.id, score)} />}
          </div>
        )}

        {lesson.quiz && lesson.quiz.length > 0 && (
          <div className="mt-12 p-8 bg-white border-2 border-orange-100 rounded-[2rem]">
            <h3 className="text-xl font-bold text-orange-900 mb-6">Bài tập trắc nghiệm</h3>
            <QuizComponent questions={lesson.quiz} onComplete={(score) => completeLesson(lesson.id, score)} />
          </div>
        )}

        {/* Góc Vận Dụng */}
        {isTeacher && (
          <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Giao bài tập này</h4>
              <p className="text-sm text-slate-500">Học sinh và phụ huynh sẽ nhận được thông báo.</p>
            </div>
            <button onClick={() => setShowAssignModal(true)} disabled={isAssigned} className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all", isAssigned ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200")}>{isAssigned ? <Check size={20} /> : <Bell size={20} />} {isAssigned ? "Đã giao" : "Giao bài về nhà"}</button>
          </div>
        )}

        <div className="mt-12">
          <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2">
            <Sparkles className="text-yellow-500" /> Góc Vận Dụng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Star size={100} />
              </div>
              <h4 className="font-bold text-yellow-800 mb-2 text-lg">Thám tử tìm chữ</h4>
              <p className="text-yellow-900/80 font-medium">
                Em hãy tìm 3 đồ vật trong nhà có tên chứa âm <span className="text-2xl font-black text-orange-500 mx-1">{lesson.content}</span>
              </p>
            </div>

            {lesson.examples.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BookOpen size={100} />
                </div>
                <h4 className="font-bold text-blue-800 mb-2 text-lg">Nhà văn nhí</h4>
                <p className="text-blue-900/80 font-medium">
                  Đặt một câu với từ <span className="text-xl font-black text-blue-600 mx-1">{lesson.examples[0]}</span> và kể cho ba mẹ nghe.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-12 border-t border-orange-100">
        <h3 className="text-xl font-bold text-orange-900 mb-6">Luyện đọc toàn bài</h3>
        <StudentAudioRecorder
          expectedText={
            Array.isArray(lesson.passage) ? lesson.passage.join(' ') : (lesson.passage || lesson.content)
          }
          onFeedback={onFeedback}
          recordingId={`student-${currentUserId}-${lesson.id}-full`}
        />
        {aiFeedback && <FeedbackBox feedback={aiFeedback} />}
      </div>

      <AnimatePresence>
        {showAssignModal && (
          <AssignmentModal
            onClose={() => setShowAssignModal(false)}
            onConfirm={(msg, date) => {
              assignLesson(lesson.id, msg, date);
              setShowAssignModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LessonEditor({ lesson, onSave, onCancel }: { lesson: Lesson, onSave: (id: string, updates: Partial<Lesson>) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: lesson.title,
    content: lesson.content,
    passage: Array.isArray(lesson.passage) ? lesson.passage.join('\n') : (lesson.passage || ''),
    examples: lesson.examples.join(', '),
    topic: lesson.topic || '',
    type: lesson.type,
    book: lesson.book,
    quiz: lesson.quiz ? JSON.parse(JSON.stringify(lesson.quiz)) : [],
    exercise: lesson.exercise ? JSON.parse(JSON.stringify(lesson.exercise)) : { type: 'word-builder', data: { word: '', parts: [] } }
  });

  const handleQuizChange = (index: number, field: string, value: any) => {
    const newQuiz = [...formData.quiz];
    newQuiz[index] = { ...newQuiz[index], [field]: value };
    setFormData({ ...formData, quiz: newQuiz });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuiz = [...formData.quiz];
    const newOptions = [...newQuiz[qIndex].options];
    newOptions[oIndex] = value;
    newQuiz[qIndex] = { ...newQuiz[qIndex], options: newOptions };
    setFormData({ ...formData, quiz: newQuiz });
  };

  const addQuizQuestion = () => {
    setFormData({
      ...formData,
      quiz: [...formData.quiz, { question: '', options: ['', '', ''], correctAnswer: 0 }]
    });
  };

  const removeQuizQuestion = (index: number) => {
    setFormData({
      ...formData,
      quiz: formData.quiz.filter((_, i: number) => i !== index)
    });
  };

  const handleExerciseTypeChange = (type: string) => {
    let defaultData = {};
    if (type === 'word-builder') defaultData = { word: '', parts: [] };
    else if (type === 'fill-blank') defaultData = { image: '', word: '', missing: '' };
    else if (type === 'matching') defaultData = { pairs: [] };

    setFormData({
      ...formData,
      exercise: { type: type as any, data: defaultData }
    });
  };

  const handleExerciseDataChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      exercise: {
        ...formData.exercise,
        data: { ...formData.exercise.data, [field]: value }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(lesson.id, {
      title: formData.title,
      content: formData.content,
      passage: formData.passage.includes('\n') ? formData.passage.split('\n') : formData.passage,
      examples: formData.examples.split(',').map(s => s.trim()).filter(s => s !== ''),
      topic: formData.topic,
      type: formData.type,
      book: formData.book,
      quiz: formData.quiz,
      exercise: formData.exercise
    });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border-2 border-emerald-100 min-h-[70vh]">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-emerald-900">Chỉnh sửa bài học</h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Basic Info Section */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Layout size={20} className="text-emerald-500" /> Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tiêu đề bài học</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Chủ đề (Tùy chọn)</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Loại bài học</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              >
                <option value="vowel">Âm</option>
                <option value="rhyme">Vần</option>
                <option value="reading">Bài đọc</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tập sách</label>
              <select
                value={formData.book}
                onChange={(e) => setFormData({ ...formData, book: parseInt(e.target.value) as 1 | 2 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
              >
                <option value={1}>Tập 1</option>
                <option value={2}>Tập 2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Âm/Vần chính</label>
            <input
              type="text"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-2xl font-black text-orange-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Các từ ví dụ (Phân tách bằng dấu phẩy)</label>
            <input
              type="text"
              value={formData.examples}
              onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ví dụ: ba, bà, bá"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Đoạn văn luyện đọc (Xuống dòng cho mỗi đoạn)</label>
            <textarea
              value={formData.passage}
              onChange={(e) => setFormData({ ...formData, passage: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] leading-relaxed"
            />
          </div>
        </section>

        {/* Quiz Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Trắc nghiệm ({formData.quiz.length})
            </h3>
            <button
              type="button"
              onClick={addQuizQuestion}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus size={16} /> Thêm câu hỏi
            </button>
          </div>

          <div className="space-y-6">
            {formData.quiz.map((q: any, qIndex: number) => (
              <div key={qIndex} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group/q">
                <button
                  type="button"
                  onClick={() => removeQuizQuestion(qIndex)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Câu hỏi {qIndex + 1}</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {q.options.map((opt: string, oIndex: number) => (
                    <div key={oIndex} className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lựa chọn {oIndex + 1}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className={cn("flex-1 px-3 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm",
                            q.correctAnswer === oIndex ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200")}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuizChange(qIndex, 'correctAnswer', oIndex)}
                          className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            q.correctAnswer === oIndex ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 text-slate-300 hover:border-emerald-200")}
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {formData.quiz.length === 0 && (
              <p className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                Chưa có câu hỏi trắc nghiệm nào
              </p>
            )}
          </div>
        </section>

        {/* Exercise Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-500" /> Bài tập nhỏ
            </h3>
            <select
              value={formData.exercise.type}
              onChange={(e) => handleExerciseTypeChange(e.target.value)}
              className="text-sm font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="word-builder">Sắp xếp chữ (Word Builder)</option>
              <option value="fill-blank">Điền từ còn thiếu (Fill Blank)</option>
              <option value="matching">Nối từ (Matching)</option>
            </select>
          </div>

          <div className="p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100">
            {formData.exercise.type === 'word-builder' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Từ khóa chính</label>
                  <input
                    type="text"
                    value={formData.exercise.data.word}
                    onChange={(e) => handleExerciseDataChange('word', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ví dụ: bế bé"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Các phần tách rời (Phân tách bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.exercise.data.parts) ? formData.exercise.data.parts.join(', ') : ''}
                    onChange={(e) => handleExerciseDataChange('parts', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ví dụ: bế, bé"
                  />
                </div>
              </div>
            )}

            {formData.exercise.type === 'fill-blank' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">URL Hình ảnh</label>
                  <input
                    type="text"
                    value={formData.exercise.data.image}
                    onChange={(e) => handleExerciseDataChange('image', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Từ hiển thị (Dùng _ cho chỗ trống)</label>
                    <input
                      type="text"
                      value={formData.exercise.data.word}
                      onChange={(e) => handleExerciseDataChange('word', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                      placeholder="b_"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Ký tự còn thiếu</label>
                    <input
                      type="text"
                      value={formData.exercise.data.missing}
                      onChange={(e) => handleExerciseDataChange('missing', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                      placeholder="o"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.exercise.type === 'matching' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Các cặp từ nối (Trái - Phải)</label>
                <div className="space-y-2">
                  {(formData.exercise.data.pairs || []).map((pair: any, pIndex: number) => (
                    <div key={pIndex} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => {
                          const newPairs = [...formData.exercise.data.pairs];
                          newPairs[pIndex] = { ...newPairs[pIndex], left: e.target.value };
                          handleExerciseDataChange('pairs', newPairs);
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm"
                        placeholder="Trái"
                      />
                      <span className="text-emerald-300">↔</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => {
                          const newPairs = [...formData.exercise.data.pairs];
                          newPairs[pIndex] = { ...newPairs[pIndex], right: e.target.value };
                          handleExerciseDataChange('pairs', newPairs);
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-emerald-100 rounded-xl text-sm"
                        placeholder="Phải"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPairs = formData.exercise.data.pairs.filter((_: any, i: number) => i !== pIndex);
                          handleExerciseDataChange('pairs', newPairs);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newPairs = [...(formData.exercise.data.pairs || []), { left: '', right: '' }];
                    handleExerciseDataChange('pairs', newPairs);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Thêm cặp từ
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Save/Cancel Buttons */}
        <div className="pt-8 border-t border-slate-100 flex gap-4">
          <button
            type="submit"
            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Save size={20} /> Lưu thay đổi
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function FillBlankExercise({ data, onComplete }: any) {
  return (
    <div className="p-8 bg-orange-50 rounded-3xl border-2 border-orange-100 text-center">
      <img src={data.image} alt="Exercise" className="w-32 h-32 mx-auto rounded-2xl mb-4 object-cover" referrerPolicy="no-referrer" />
      <h3 className="text-xl font-bold text-orange-900 mb-4">Điền chữ cái còn thiếu</h3>
      <div className="text-4xl font-black text-orange-600 flex justify-center gap-2">
        {data.word.split('').map((char: string, i: number) => (
          <span key={i} className={char === '_' ? "border-b-4 border-orange-400 w-10" : ""}>{char === '_' ? "" : char}</span>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {['o', 'a', 'e', 'u', 'i'].map(opt => (
          <button key={opt} onClick={() => opt === data.missing && onComplete(100)} className="w-12 h-12 bg-white border-2 border-orange-200 rounded-xl font-bold text-xl hover:bg-orange-500 hover:text-white transition-colors">{opt}</button>
        ))}
      </div>
    </div>
  );
}

function FeedbackBox({ feedback }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 p-6 bg-green-50 rounded-3xl border border-green-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"><Star size={24} /></div>
        <div>
          <h4 className="font-bold text-green-900">Kết quả luyện tập</h4>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= Math.ceil(feedback.accuracy / 20) ? "#22c55e" : "none"} className={s <= Math.ceil(feedback.accuracy / 20) ? "text-green-500" : "text-green-200"} />)}
            <span className="ml-2 text-xs font-bold text-green-700">{feedback.accuracy}%</span>
          </div>
        </div>
      </div>
      <p className="text-green-800 leading-relaxed font-medium">{feedback.feedback}</p>
      <div className="mt-4 pt-4 border-t border-green-100 text-xs text-green-600 italic">Con đã đọc: "{feedback.transcription}"</div>
    </motion.div>
  );
}

function StatCard({ icon, value, label, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className={cn("p-6 rounded-3xl border shadow-sm flex items-center gap-4 bg-white", colors[color])}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color].split(' ')[0])}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

function WelcomeBox() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-orange-50 shadow-sm">
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-6"><BookOpen size={48} /></div>
      <h2 className="text-2xl font-bold text-orange-900 mb-2">Chào mừng con đến với lớp học!</h2>
      <p className="text-gray-500 max-w-sm">Hãy chọn một bài học ở bên trái để bắt đầu hành trình khám phá những con chữ kỳ diệu nhé.</p>
    </div>
  );
}

function TeacherDashboard({ progress, users, addUser, addBulkUsers, classes, onAddClass, onReset, lessons }: { progress: ProgressData, users: UserProfile[], addUser: (name: string, classId?: string) => void, addBulkUsers: (names: string[], classId: string) => number, classes: ClassGroup[], onAddClass: (name: string) => void, onReset?: () => void, lessons: Lesson[] }) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  // Filter students by selected class
  const classStudents = users.filter(u => u.classId === selectedClassId || (!u.classId && selectedClassId === '1A3')); // Fallback for old data

  const [allStudentsProgress, setAllStudentsProgress] = useState<Record<string, ProgressData>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAllProgress = async () => {
    if (classStudents.length === 0) return;
    setIsSyncing(true);
    const progressMap: Record<string, ProgressData> = {};

    try {
      // Sử dụng API bulk fetch mới để lấy tất cả dữ liệu chỉ trong 1 request
      const userIds = classStudents.map(u => u.id).join(',');
      const res = await fetch(`/api/progress?userIds=${userIds}`);

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results)) {
          results.forEach((p: any) => {
            progressMap[p.userId] = p;
          });
        }
      } else {
        // Fallback sang fetch từng người nếubulk fetch lỗi (vd: URL quá dài)
        await Promise.all(classStudents.map(async (user) => {
          try {
            const r = await fetch(`/api/progress?userId=${user.id}`);
            if (r.ok) {
              const data = await r.json();
              if (data) progressMap[user.id] = data;
            }
          } catch (e) { }
        }));
      }
      setAllStudentsProgress(progressMap);
    } catch (error) {
      console.error("Error fetching all progress:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Tải tiến độ của tất cả học sinh từ server khi chọn lớp hoặc khi danh sách users thay đổi
  useEffect(() => {
    fetchAllProgress();
  }, [selectedClassId, users.length]);

  const students = classStudents.map(user => {
    const userId = user.id;
    // Ưu tiên dữ liệu từ server (allStudentsProgress), sau đó mới đến local (nếu có)
    const serverProgress = allStudentsProgress[userId];
    let localProgress: ProgressData | null = null;
    try {
      const saved = localStorage.getItem(`htl1-progress-${userId}`);
      if (saved) localProgress = JSON.parse(saved);
    } catch (e) { }

    const userProgress = serverProgress || localProgress;
    const completedCount = userProgress?.completedLessons?.length || 0;
    const scores = userProgress ? Object.values(userProgress.scores || {}) : [];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const lastActive = userProgress?.lastActivity ? new Date(userProgress.lastActivity).toLocaleDateString('vi-VN') : 'Chưa học';

    return {
      id: userId,
      name: user.name,
      completedCount,
      avgScore,
      lastActive,
      progress: userProgress
    };
  });

  const participationRate = students.length > 0
    ? Math.round((students.filter(s => s.completedCount > 0).length / students.length) * 100)
    : 0;

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length > 0) {
        if (confirm(`Tìm thấy ${lines.length} học sinh trong file. Bạn có muốn thêm các học sinh chưa có vào lớp không?`)) {
          const addedCount = addBulkUsers(lines, selectedClassId);
          alert(`${addedCount} học sinh mới đã được thêm thành công! ${lines.length - addedCount} học sinh đã tồn tại.`);
        }
      } else {
        alert("File không có dữ liệu hoặc định dạng không đúng. Vui lòng sử dụng file CSV với một cột chứa tên học sinh.");
      }
    };
    reader.readAsText(file, 'UTF-8');

    // Reset file input to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAddClass = () => {
    if (newClassName.trim()) {
      onAddClass(newClassName.trim());
      setNewClassName('');
      setIsAddingClass(false);
    }
  };

  const handleAddStudent = () => {
    if (newStudentName.trim()) {
      addUser(newStudentName.trim(), selectedClassId);
      setNewStudentName('');
      setIsAddingStudent(false);
      alert(`Đã thêm học sinh ${newStudentName} thành công!`);
    }
  };

  const exportToExcel = () => {
    const headers = ["Họ và tên", "Mã học sinh", "Số bài đã học", "Điểm trung bình", "Hoạt động cuối"];
    const csvContent = [
      headers.join(","),
      ...students.map(s => [
        `"${s.name}"`,
        `"${s.id}"`,
        s.completedCount,
        s.avgScore,
        `"${s.lastActive}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const className = classes.find(c => c.id === selectedClassId)?.name || 'Danh_sach';
    link.setAttribute("download", `Danh_sach_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedStudent) {
    const studentProgress = selectedStudent.progress || {
      completedLessons: [],
      scores: {},
      detailedScores: {},
      lastActivity: new Date().toISOString()
    };

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        <button
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Quay lại danh sách lớp
        </button>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500">
              {selectedStudent.name[0]}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">{selectedStudent.name}</h2>
              <p className="text-slate-400 font-medium">Mã số: {selectedStudent.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="text-3xl font-black text-emerald-700">{selectedStudent.completedCount}</div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Bài đã nộp</div>
            </div>
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <div className="text-3xl font-black text-blue-700">{selectedStudent.avgScore}%</div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">Điểm trung bình</div>
            </div>
            <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
              <div className="text-xl font-black text-purple-700">{selectedStudent.lastActive}</div>
              <div className="text-xs font-bold text-purple-600 uppercase tracking-widest">Hoạt động cuối</div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-6">Chi tiết bài nộp</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Bài học</th>
                  <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Âm/Vần</th>
                  <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Từ ví dụ</th>
                  <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Đoạn văn</th>
                  <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Điểm TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentProgress.completedLessons.map((lessonId: string) => {
                  const lesson = lessons.find(l => l.id === lessonId);
                  const scores = studentProgress.detailedScores[lessonId] || {};
                  if (!lesson) return null;

                  return (
                    <tr key={lessonId} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-slate-700">{lesson.title}</div>
                      </td>
                      <td className="py-4">
                        {scores.main !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-600">{scores.main}%</span>
                            <StudentAudioPlayer recordingId={`student-${selectedStudent.id}-${lessonId}-main`} />
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4">
                        {scores.examples ? (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(scores.examples).map(([idx, score]: [any, any]) => (
                              <div key={idx} className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-blue-600">{score}%</span>
                                <StudentAudioPlayer recordingId={`student-${selectedStudent.id}-${lessonId}-ex-${idx}`} />
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4">
                        {scores.passage !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-purple-600">{scores.passage}%</span>
                            <StudentAudioPlayer recordingId={`student-${selectedStudent.id}-${lessonId}-passage`} />
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          {studentProgress.scores[lessonId]}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {studentProgress.completedLessons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      Chưa có bài nộp nào từ học sinh này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Users size={24} />} value={students.length.toString()} label="Học sinh" color="emerald" />
        <StatCard icon={<BarChart3 size={24} />} value={`${participationRate}%`} label="Tỷ lệ tham gia" color="blue" />
        <StatCard icon={<Settings size={24} />} value={lessons.length.toString()} label="Tổng số bài học" color="purple" />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Danh sách lớp</h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={cn("px-3 py-1 rounded-lg text-sm font-bold transition-all",
                    selectedClassId === cls.id ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-slate-200"
                  )}
                >{cls.name}</button>
              ))}
              <button onClick={() => setIsAddingClass(true)} className="px-3 py-1 rounded-lg text-sm font-bold text-emerald-600 hover:bg-emerald-100 transition-all"><Plus size={16} /></button>
            </div>
            <button
              onClick={fetchAllProgress}
              disabled={isSyncing}
              className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RefreshCw size={16} className={cn(isSyncing && "animate-spin")} />
            </button>

            {/* Add Class Modal/Input */}
            {isAddingClass && (
              <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setIsAddingClass(false)}>
                <div className="bg-white p-4 rounded-2xl shadow-xl flex gap-2" onClick={e => e.stopPropagation()}>
                  <input autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Tên lớp mới..." className="border rounded-lg px-3 py-2" />
                  <button onClick={handleAddClass} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold">Thêm</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddingStudent(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              <Plus size={18} /> Thêm học sinh
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors"
            >
              <Upload size={18} /> Nhập từ Excel
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".csv, text/csv"
              className="hidden"
            />
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-colors"
            >
              <Download size={18} /> Xuất Excel
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors"
              >
                <Trash2 size={18} /> Làm mới DS
              </button>
            )}
            <div className="text-sm font-bold text-slate-400">Sĩ số: {students.length} học sinh</div>
            {isSyncing && <div className="text-[10px] font-bold text-blue-500 animate-pulse bg-blue-50 px-2 py-1 rounded-lg">Đang đồng bộ dữ liệu lớp...</div>}

            {/* Add Student Modal */}
            <AnimatePresence>
              {isAddingStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-6" onClick={() => setIsAddingStudent(false)}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full"
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-black text-slate-900 mb-4">Thêm học sinh mới</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Họ và tên học sinh</label>
                        <input
                          autoFocus
                          value={newStudentName}
                          onChange={e => setNewStudentName(e.target.value)}
                          placeholder="Nguyễn Văn A..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                          onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setIsAddingStudent(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">Hủy</button>
                        <button onClick={handleAddStudent} className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm">Thêm em</button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Học sinh</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Bài đã nộp</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Điểm TB</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Hoạt động cuối</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                        {student.name[0]}
                      </div>
                      <span className="font-bold text-slate-700">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${(student.completedCount / lessons.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{student.completedCount}/{lessons.length}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      student.avgScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                        student.avgScore >= 50 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    )}>
                      {student.avgScore}%
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-500 font-medium">{student.lastActive}</span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white transition-all"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function ParentDashboard({ users, classes, lessons, currentUserId }: { users: UserProfile[], classes: ClassGroup[], lessons: Lesson[], currentUserId: string }) {
  const { assignments } = useAssignments();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Lấy danh sách con (học sinh) của phụ huynh này. 
  // Hiện tại ta giả định phụ huynh xem các học sinh trong cùng lớp (hoặc có logic liên kết riêng)
  // Đơn giản nhất: Lấy học sinh đầu tiên trong danh sách nếu chưa chọn
  useEffect(() => {
    if (!selectedStudentId) {
      if (currentUserId && currentUserId !== 'default' && users.some(u => u.id === currentUserId)) {
        setSelectedStudentId(currentUserId);
      } else if (users.length > 0) {
        const firstStudent = users.find(u => u.role === 'student' || !u.role);
        if (firstStudent) setSelectedStudentId(firstStudent.id);
      }
    }
  }, [users, selectedStudentId, currentUserId]);

  // Tải tiến độ của học sinh được chọn
  const [studentProgress, setStudentProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (selectedStudentId) {
      const saved = localStorage.getItem(`htl1-progress-${selectedStudentId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Đảm bảo đầy đủ các trường dữ liệu để không bị lỗi render
          setStudentProgress({
            completedLessons: [],
            scores: {},
            detailedScores: {},
            username: 'Học sinh',
            points: 0,
            badges: [],
            lastActivity: new Date().toISOString(),
            ...parsed
          });
        } catch (e) {
          console.error("Failed to parse student progress", e);
        }
      } else {
        // Thử tải từ API nếu không có local
        fetch(`/api/progress?userId=${selectedStudentId}`)
          .then(res => res.json())
          .then(data => {
            if (data) {
              setStudentProgress({
                completedLessons: [],
                scores: {},
                detailedScores: {},
                username: 'Học sinh',
                points: 0,
                badges: [],
                lastActivity: new Date().toISOString(),
                ...data
              });
            }
          })
          .catch(() => setStudentProgress(null));
      }
    }
  }, [selectedStudentId]);

  if (!selectedStudentId || !studentProgress) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <div className="text-slate-400 italic font-medium">Đang tải dữ liệu của con...</div>
      </div>
    );
  }

  // Tính toán dữ liệu cho biểu đồ tuần
  const getWeeklyStats = () => {
    const stats = [];
    const now = new Date();
    const dates = studentProgress.completionDates || {};

    const currentDay = now.getDay() || 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - currentDay + 1);

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const count = Object.values(dates).filter(dateStr => {
        const d = new Date(dateStr);
        return d >= weekStart && d <= weekEnd;
      }).length;

      let label = i === 0 ? "Tuần này" : i === 1 ? "Tuần trước" : `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      stats.push({ label, count });
    }
    return stats;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-orange-900">Góc Phụ Huynh</h2>
          <p className="text-slate-500 font-medium">Theo dõi hành trình của con: <span className="text-orange-600 font-bold">{studentProgress.username}</span></p>
        </div>
        {users.length > 2 && ( // Nếu có nhiều hơn 1 học sinh
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-4 py-2 bg-white border border-orange-200 rounded-xl font-bold text-orange-900 outline-none focus:ring-2 focus:ring-orange-500"
          >
            {users.filter(u => u.id !== 'parent' && u.id !== 'admin').map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      <ProgressDashboard progress={studentProgress} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WeeklyProgressChart data={getWeeklyStats()} />

        <div className="bg-white p-8 rounded-[2.5rem] border border-red-50 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Bell className="text-red-500" /> Bài tập từ cô giáo</h3>
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic">Hiện tại không có bài tập về nhà.</div>
            ) : (
              assignments.map(a => {
                const lesson = lessons.find(l => l.id === a.lessonId);
                const isCompleted = studentProgress.completedLessons.includes(a.lessonId);
                return (
                  <div key={a.id} className={cn("p-4 rounded-2xl border flex items-start justify-between gap-4", isCompleted ? "bg-green-50 border-green-100" : "bg-white border-red-100 shadow-sm")}>
                    <div>
                      <div className="font-bold text-slate-900">{lesson?.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12} /> {new Date(a.timestamp).toLocaleDateString('vi-VN')}</div>
                      <div className="text-sm text-slate-700 mt-2 italic bg-white/50 p-2 rounded-lg border border-slate-100">"{a.message}"</div>
                      {a.dueDate && <div className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1"><Calendar size={12} /> Hạn nộp: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</div>}
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap", isCompleted ? "bg-green-200 text-green-800" : "bg-red-100 text-red-600")}>
                      {isCompleted ? "Đã xong" : "Chưa làm"}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm">
        <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2">
          <Sparkles className="text-orange-500" /> Chi tiết các bài nộp của con
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-orange-100">
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Bài học</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Âm/Vần</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Đoạn văn</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-xs tracking-widest text-right">Điểm TB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {(studentProgress.completedLessons || []).map((id: string) => {
                const lesson = lessons.find(l => l.id === id);
                const scores = (studentProgress.detailedScores && studentProgress.detailedScores[id]) || {};
                if (!lesson) return null;

                return (
                  <tr key={id} className="group hover:bg-orange-50/30 transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-slate-700">{lesson.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {studentProgress.completionDates?.[id] ? new Date(studentProgress.completionDates[id]).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </td>
                    <td className="py-4">
                      {scores.main !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-600">{scores.main}%</span>
                          <StudentAudioPlayer recordingId={`student-${selectedStudentId}-${id}-main`} />
                        </div>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-4">
                      {scores.passage !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-600">{scores.passage}%</span>
                          <StudentAudioPlayer recordingId={`student-${selectedStudentId}-${id}-passage`} />
                        </div>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black">
                        {studentProgress.scores[id]}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {studentProgress.completedLessons.length === 0 && (
                <tr className="w-full">
                  <td colSpan={4} className="text-center py-12 text-gray-400 italic">Con chưa hoàn thành bài học nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function WeeklyProgressChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 5); // Ít nhất là 5 để cột không quá cao khi ít dữ liệu

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-50 shadow-sm flex flex-col">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <BarChart3 className="text-indigo-500" /> Biểu đồ học tập
      </h3>
      <div className="flex-1 flex items-end justify-between gap-4 min-h-[200px] pt-8 px-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
            <div className="relative w-full flex justify-center items-end h-full bg-indigo-50/30 rounded-2xl overflow-hidden">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.count / max) * 100}%` }}
                className="w-full max-w-[40px] bg-indigo-500 rounded-t-xl relative group-hover:bg-indigo-600 transition-colors min-h-[4px]"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.count} bài
                </div>
              </motion.div>
            </div>
            <div className="text-xs font-bold text-slate-400 text-center whitespace-nowrap">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: (msg: string, date: string) => void }) {
  const [message, setMessage] = useState("Hoàn thành bài học này và luyện đọc thật to nhé!");
  const [dueDate, setDueDate] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900">Giao bài tập về nhà</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Lời nhắn của giáo viên</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 resize-none"
              rows={3}
              placeholder="Nhập lời nhắn..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hạn nộp bài (Tùy chọn)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Hủy</button>
            <button onClick={() => onConfirm(message, dueDate)} className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Giao bài ngay</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
