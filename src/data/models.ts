import mongoose from 'mongoose';

// Schema cho người dùng (Học sinh, Giáo viên, Phụ huynh)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, default: '' },
    fullName: { type: String },
    role: { type: String, default: 'student' },
    classId: { type: String, default: '1A3' },
    createdAt: { type: Date, default: Date.now }
});

// Schema lưu tiến độ học tập (JSON data)
const progressSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: String, // Lưu thêm username để tiện hiển thị leaderboard
    role: String,     // Lưu role để lọc học sinh
    data: { type: Object }, // Chứa toàn bộ object progress (điểm, bài đã học...)
    points: { type: Number, default: 0 }, // Tách điểm ra để dễ sort leaderboard
    completedLessons: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
});

// Schema bảng xếp hạng (Có thể gộp vào Progress, nhưng tách ra nếu muốn cache riêng)
// Ở đây ta sẽ dùng trực tiếp Progress để query Leaderboard cho đơn giản

// Export models, kiểm tra xem model đã tồn tại chưa để tránh lỗi khi Hot Reload
// Dùng 'as any' để tránh lỗi TypeScript "union type not callable" khi import qua nhiều đường dẫn
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const User = (mongoose.models['User'] || mongoose.model('User', userSchema)) as mongoose.Model<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Progress = (mongoose.models['Progress'] || mongoose.model('Progress', progressSchema)) as mongoose.Model<any>;
// Leaderboard có thể query trực tiếp từ Progress
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Leaderboard = (mongoose.models['Leaderboard'] || mongoose.model('Leaderboard', new mongoose.Schema({}))) as mongoose.Model<any>;
