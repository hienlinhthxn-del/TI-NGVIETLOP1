import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Baby, Users, ArrowLeft, Lock, User, Check, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AuthScreenProps {
    onLogin: (role: 'student' | 'teacher' | 'parent', userData: any) => void;
    loginService: (username: string, password?: string) => Promise<{ success: boolean; error?: string; user?: any }>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, loginService }) => {
    const [step, setStep] = useState<'role' | 'login' | 'select-student'>('role');
    const [role, setRole] = useState<'student' | 'teacher' | 'parent' | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if (role === 'student') {
            fetchStudents();
        }
    }, [role]);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/auth/students?classId=1A3'); // Mặc định lớp 1A3
            const data = await res.json();
            setStudents(data);
        } catch (e) {
            console.error("Failed to fetch students");
        }
    };

    const handleLogin = async (e?: React.FormEvent, selectedUser?: string) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        const targetUsername = selectedUser || username;
        const res = await loginService(targetUsername, password);

        if (res.success) {
            onLogin(role || 'student', res.user);
        } else {
            setError(res.error || 'Đăng nhập thất bại');
        }
        setLoading(false);
    };

    if (step === 'role') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Chào mừng bạn!</h1>
                    <p className="text-slate-500 font-medium">Chọn vai trò để tiếp tục</p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
                    <RoleCard
                        icon={<Baby size={48} />}
                        title="Học Sinh"
                        desc="Em muốn luyện đọc"
                        color="blue"
                        onClick={() => { setRole('student'); setStep('select-student'); }}
                    />
                    <RoleCard
                        icon={<GraduationCap size={48} />}
                        title="Giáo Viên"
                        desc="Soạn bài & Quản lý"
                        color="emerald"
                        onClick={() => { setRole('teacher'); setStep('login'); }}
                    />
                    <RoleCard
                        icon={<Users size={48} />}
                        title="Phụ Huynh"
                        desc="Theo dõi con học"
                        color="orange"
                        onClick={() => { setRole('parent'); setStep('login'); }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-orange-100 max-w-md w-full relative overflow-hidden"
            >
                <button
                    onClick={() => setStep('role')}
                    className="absolute top-8 left-8 p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex flex-col items-center mb-8">
                    <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg mb-6",
                        role === 'student' ? "bg-blue-500" : role === 'teacher' ? "bg-emerald-500" : "bg-orange-500")}>
                        {role === 'student' ? <Baby size={40} /> : role === 'teacher' ? <GraduationCap size={40} /> : <Users size={40} />}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">
                        {role === 'student' ? 'Chào con yêu!' : role === 'teacher' ? 'Đăng nhập Giáo viên' : 'Đăng nhập Phụ huynh'}
                    </h2>
                    <p className="text-slate-400 font-medium text-center mt-2">
                        {role === 'student' ? 'Hãy chọn tên của mình để bắt đầu học nhé' : 'Vui lòng nhập tài khoản để tiếp tục'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                {step === 'select-student' ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {students.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic text-sm">Đang tải danh sách học sinh...</div>
                        ) : students.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setUsername(s.username); handleLogin(undefined, s.username); }}
                                className="w-full p-4 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-between group"
                                disabled={loading}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        {s.fullName[0]}
                                    </div>
                                    <span className="font-bold text-slate-700">{s.fullName}</span>
                                </div>
                                <Check size={18} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                        <div className="pt-4 border-t border-slate-50 mt-4">
                            <p className="text-[10px] text-slate-400 text-center italic">Nếu không thấy tên mình, em hãy nhờ cô giáo thêm em vào lớp nhé!</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tài khoản</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                    placeholder="Tên đăng nhập..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn("w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:active:scale-100",
                                role === 'teacher' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-orange-500 hover:bg-orange-600 shadow-orange-200")}>
                            {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

interface RoleCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    color: 'blue' | 'emerald' | 'orange';
    onClick: () => void;
}

function RoleCard({ icon, title, desc, color, onClick }: RoleCardProps) {
    return (
        <motion.button
            whileHover={{ y: -8 }}
            onClick={onClick}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center group relative w-full"
        >
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform",
                color === 'blue' ? "bg-blue-50 text-blue-500" : color === 'emerald' ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500")}>
                {icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-400 font-medium">{desc}</p>
        </motion.button>
    );
}
