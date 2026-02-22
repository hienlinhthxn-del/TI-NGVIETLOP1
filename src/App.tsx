import React, { useState } from 'react';
import { BookOpen, GraduationCap, Layout, ChevronRight, Star, Home, CheckCircle2, Trophy, Users, Baby, Lock, ArrowLeft, BarChart3, Settings, Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { lessons, Lesson } from './data/lessons';
import { QuizComponent } from './components/QuizComponent';
import { WordBuilder } from './components/WordBuilder';
import { SampleAudioPlayer } from './components/SampleAudioPlayer';
import { StudentAudioRecorder } from './components/StudentAudioRecorder';
import { StudentAudioPlayer } from './components/StudentAudioPlayer';
import { useProgress, ProgressDashboard, type ProgressData } from './services/progressService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'student' | 'teacher' | 'parent' | null;

export default function App() {
  const [role, setRole] = useState<Role>(null);
  const [activeTab, setActiveTab] = useState<'tap1' | 'tap2'>('tap1');
  const [teacherView, setTeacherView] = useState<'lessons' | 'dashboard'>('lessons');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [aiFeedback, setAiFeedback] = useState<{ transcription: string; feedback: string; accuracy: number } | null>(null);
  const { progress, completeLesson, setUsername, users, currentUserId, addUser, switchUser, deleteUser } = useProgress();
  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState(progress.username);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const filteredLessons = lessons.filter(l => 
    activeTab === 'tap1' ? l.book === 1 : l.book === 2
  );

  if (!role) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Chào mừng bạn!</h1>
          <p className="text-slate-500 font-medium">Chọn vai trò để tiếp tục</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <RoleCard icon={<Baby size={48} />} title="Học Sinh" desc="Em muốn luyện đọc" color="blue" onClick={() => setRole('student')} />
          <RoleCard icon={<GraduationCap size={48} />} title="Giáo Viên" desc="Soạn bài & Quản lý" color="emerald" onClick={() => setRole('teacher')} />
          <RoleCard icon={<Users size={48} />} title="Phụ Huynh" desc="Theo dõi con học" color="orange" onClick={() => setRole('parent')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D2D2D] font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => { setRole(null); setSelectedLesson(null); }} className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex items-center gap-4">
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
                              onClick={(e) => { e.stopPropagation(); if(confirm(`Xóa học sinh ${user.name}?`)) deleteUser(user.id); }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
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
                    {selectedLesson ? <LessonContent lesson={selectedLesson} progress={progress} onFeedback={(f) => { setAiFeedback(f); completeLesson(selectedLesson.id, f.accuracy); }} aiFeedback={aiFeedback} completeLesson={completeLesson} role={role} /> : <WelcomeBox />}
                  </AnimatePresence>
                </div>
              </div>
            ) : <TeacherDashboard progress={progress} />}
          </>
        )}
        {role === 'parent' && <ParentDashboard progress={progress} />}
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
}

function LessonContent({ lesson, progress, onFeedback, aiFeedback, completeLesson, role }: LessonContentProps) {
  const isTeacher = role === 'teacher';
  return (
    <motion.div key={lesson.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-orange-50 min-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-widest">{lesson.book === 1 ? 'Tập 1' : 'Tập 2'}</span>
          {lesson.topic && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{lesson.topic}</span>}
        </div>
        {progress.completedLessons.includes(lesson.id) && <div className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle2 size={16} /> Đã xong</div>}
      </div>
      <h2 className="text-4xl md:text-5xl font-black text-orange-900 mb-8 tracking-tight">{lesson.title}</h2>
      <div className="flex-grow space-y-12">
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
                recordingId={`student-${lesson.id}-main`}
                onFeedback={(f) => completeLesson(lesson.id, f.accuracy, 'main')}
              />
            )}
          </div>
        </div>
        
        {lesson.examples.length > 0 && (
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
                      recordingId={`student-${lesson.id}-ex-${i}`}
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
                    recordingId={`student-${lesson.id}-passage`}
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
          </div>
        )}
        
        {lesson.quiz && (
          <div className="mt-12 p-8 bg-white border-2 border-orange-100 rounded-[2rem]">
            <h3 className="text-xl font-bold text-orange-900 mb-6">Bài tập trắc nghiệm</h3>
            <QuizComponent questions={lesson.quiz} onComplete={(score) => completeLesson(lesson.id, score)} />
          </div>
        )}
      </div>
      
      <div className="mt-12 pt-12 border-t border-orange-100">
        <h3 className="text-xl font-bold text-orange-900 mb-6">Luyện đọc toàn bài</h3>
        <StudentAudioRecorder 
          expectedText={
            Array.isArray(lesson.passage) ? lesson.passage.join(' ') : (lesson.passage || lesson.content)
          } 
          onFeedback={onFeedback} 
          recordingId={`student-${lesson.id}-full`}
        />
        {aiFeedback && <FeedbackBox feedback={aiFeedback} />}
      </div>
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

function WelcomeBox() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-orange-50 shadow-sm">
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-6"><BookOpen size={48} /></div>
      <h2 className="text-2xl font-bold text-orange-900 mb-2">Chào mừng con đến với lớp học!</h2>
      <p className="text-gray-500 max-w-sm">Hãy chọn một bài học ở bên trái để bắt đầu hành trình khám phá những con chữ kỳ diệu nhé.</p>
    </div>
  );
}

function TeacherDashboard({ progress }: { progress: ProgressData }) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Mock data for 29 students
  const students = Array.from({ length: 29 }, (_, i) => ({
    id: `student-${i + 1}`,
    name: i === 0 ? 'Nguyễn Văn A (Bạn)' : `Học sinh ${i + 1}`,
    completedCount: i === 0 ? progress.completedLessons.length : Math.floor(Math.random() * 10),
    avgScore: i === 0 
      ? (progress.completedLessons.length > 0 
          ? Math.round((Object.values(progress.scores) as number[]).reduce((a: number, b: number) => a + b, 0) / progress.completedLessons.length) 
          : 0)
      : Math.floor(Math.random() * 40) + 60,
    lastActive: i === 0 ? new Date(progress.lastActivity).toLocaleDateString('vi-VN') : '21/02/2026',
    progress: i === 0 ? progress : null // Only show real progress for the first student (demo)
  }));

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
                            <StudentAudioPlayer recordingId={`student-${lessonId}-main`} />
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4">
                        {scores.examples ? (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(scores.examples).map(([idx, score]: [any, any]) => (
                              <div key={idx} className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-blue-600">{score}%</span>
                                <StudentAudioPlayer recordingId={`student-${lessonId}-ex-${idx}`} />
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4">
                        {scores.passage !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-purple-600">{scores.passage}%</span>
                            <StudentAudioPlayer recordingId={`student-${lessonId}-passage`} />
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
        <StatCard icon={<Users size={24} />} value="29" label="Học sinh" color="emerald" />
        <StatCard icon={<BarChart3 size={24} />} value="72%" label="Tỷ lệ hoàn thành lớp" color="blue" />
        <StatCard icon={<Settings size={24} />} value={lessons.length.toString()} label="Tổng số bài học" color="purple" />
      </div>
      
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Bảng tổng hợp lớp 1A</h2>
          <div className="text-sm font-bold text-slate-400">Sĩ số: 29 học sinh</div>
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

function ParentDashboard({ progress }: { progress: ProgressData }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className="text-3xl font-black text-orange-900">Tiến độ học tập của con</h2>
      <ProgressDashboard progress={progress} />
      <div className="bg-white p-8 rounded-[2.5rem] border border-orange-50 shadow-sm">
        <h3 className="text-xl font-bold text-orange-900 mb-6">Bài học đã hoàn thành</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.completedLessons.map((id: string) => {
            const lesson = lessons.find(l => l.id === id);
            return (
              <div key={id} className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="font-bold text-orange-900">{lesson?.title || id}</div>
                <div className="text-sm font-black text-orange-600">{progress.scores[id] || 0}%</div>
              </div>
            );
          })}
          {progress.completedLessons.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400 italic">Con chưa hoàn thành bài học nào.</div>}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, value, label, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", 
        color === 'emerald' ? "bg-emerald-50 text-emerald-600" : color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900">{value}</div>
      <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
