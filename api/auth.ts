import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb';
import { User } from '../src/data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Test endpoint
    if (req.query.test) return res.status(200).json({ status: 'Server is running', time: new Date().toISOString() });

    try {
        await dbConnect();
    } catch (dbError: any) {
        console.error('Database connection error:', dbError);
        return res.status(500).json({ error: 'DB_CONNECTION_ERROR', details: dbError.message });
    }

    // 2. Manual Seed trigger (Visit: /api/auth?seed=1)
    if (req.query.seed) {
        try {
            const adminExists = await User.findOne({ username: 'admin' });
            if (!adminExists) {
                const admin = new User({
                    username: 'admin',
                    password: 'admin123',
                    role: 'teacher',
                    fullName: 'Giáo Viên Quản Trị',
                    classId: '1A3'
                });
                await admin.save();

                // Seed default students
                const defaultStudentNames = [
                    'Hà Tâm An', 'Vũ Ngọc Khánh An', 'Hoàng Diệu Anh', 'Quàng Tuấn Anh', 'Lê Bảo Châu',
                    'Trịnh Công Dũng', 'Bùi Nhật Duy', 'Nguyễn Nhật Duy', 'Nguyễn Phạm Linh Đan', 'Nguyễn Ngọc Bảo Hân',
                    'Mào Trung Hiếu', 'Nguyễn Bá Gia Hưng', 'Vừ Gia Hưng', 'Vừ Thị Ngọc Linh', 'Đỗ Phan Duy Long',
                    'Vừ Thành Long', 'Vừ Bảo Ly', 'Quàng Thị Quốc Mai', 'Vừ Công Minh', 'Phạm Bảo Ngọc',
                    'Lò Thảo Nguyên', 'Trình Chân Nguyên', 'Lò Đức Phong', 'Thào Thị Thảo', 'Tạ Anh Thư',
                    'Lò Minh Tiến', 'Chang Trí Tuệ', 'Cà Phương Uyên', 'Bùi Uyển Vy'
                ];

                const studentsData = defaultStudentNames.map((name, index) => ({
                    username: `hs${(index + 1).toString().padStart(2, '0')}`,
                    password: '',
                    role: 'student',
                    fullName: name,
                    classId: '1A3'
                }));

                await User.insertMany(studentsData);
                return res.status(200).json({ message: 'Admin and Students created successfully' });
            }
            return res.status(200).json({ message: 'Data already exists' });
        } catch (e: any) {
            console.error('Seed error:', e);
            return res.status(500).json({ error: 'SEED_ERROR', details: e.message });
        }
    }

    if (req.method === 'POST') {
        const { action, username, password, fullName, role, classId } = req.body;

        if (action === 'register') {
            try {
                const existing = await User.findOne({ username });
                if (existing) return res.status(400).json({ error: 'Tài khoản đã tồn tại' });

                const newUser = new User({
                    username,
                    password,
                    fullName,
                    role: role || 'student',
                    classId: classId || '1A3'
                });

                await newUser.save();
                return res.status(201).json({ success: true });
            } catch (error: any) {
                console.error('Register error:', error);
                return res.status(500).json({ error: 'REGISTER_ERROR', details: error.message });
            }
        }

        if (action === 'login') {
            try {
                const user = await User.findOne({ username, password });
                if (!user) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });

                return res.status(200).json({
                    success: true,
                    user: {
                        id: user._id,
                        username: user.username,
                        fullName: user.fullName,
                        role: user.role,
                        classId: user.classId
                    }
                });
            } catch (error: any) {
                console.error('Login error:', error);
                return res.status(500).json({ error: 'LOGIN_ERROR', details: error.message });
            }
        }
    }

    if (req.method === 'GET') {
        const { classId } = req.query;
        try {
            const students = await User.find({ classId, role: 'student' }).limit(50);
            return res.status(200).json(students.map((s: any) => ({
                id: s._id,
                fullName: s.fullName,
                username: s.username,
                role: s.role
            })));
        } catch (error: any) {
            console.error('Fetch students error:', error);
            return res.status(500).json({ error: 'FETCH_STUDENTS_ERROR', details: error.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
