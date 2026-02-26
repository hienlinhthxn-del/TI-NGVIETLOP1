import mongoose from 'mongoose';

// Schema cho Tiến độ học tập
const ProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: String,
    role: String,
    completedLessons: [String],
    scores: { type: Map, of: Number },
    detailedScores: { type: Map, of: mongoose.Schema.Types.Mixed },
    lastActivity: { type: Date, default: Date.now },
    unlockedBadges: [String],
    points: { type: Number, default: 0 },
    completionDates: { type: Map, of: String }
}, { timestamps: true });

// Schema cho Lớp học
const ClassSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    teacherId: String,
    studentIds: [String]
});

// Schema cho Bài tập (Assignment)
const AssignmentSchema = new mongoose.Schema({
    lessonId: String,
    teacherId: String,
    classId: String,
    message: String,
    dueDate: Date,
    timestamp: { type: Date, default: Date.now }
});

// Schema cho Người dùng (Authentication)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Nên được hash
    role: { type: String, enum: ['student', 'teacher', 'parent', 'admin'], default: 'student' },
    fullName: String,
    classId: String,
    status: { type: String, default: 'active' }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Progress = mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);
export const Class = mongoose.models.Class || mongoose.model('Class', ClassSchema);
export const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
