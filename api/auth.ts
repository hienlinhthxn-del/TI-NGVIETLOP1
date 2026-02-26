import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb';
import { User } from '../src/data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await dbConnect();
    } catch (dbError: any) {
        console.error('Database connection error:', dbError);
        return res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu: ' + dbError.message });
    }

    // Auto-seed admin if database is empty
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Database empty, seeding admin user...');
            const admin = new User({
                username: 'admin',
                password: 'admin123',
                role: 'teacher',
                fullName: 'Giáo Viên Quản Trị',
                classId: '1A3'
            });
            await admin.save();
            console.log('Admin user seeded successfully');
        }
    } catch (seedError) {
        console.error('Seeding error:', seedError);
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
                return res.status(201).json({ success: true, user: { username, fullName, role } });
            } catch (error) {
                console.error('Register error:', error);
                return res.status(500).json({ error: 'Lỗi đăng ký' });
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
            } catch (error) {
                console.error('Login error:', error);
                return res.status(500).json({ error: 'Lỗi đăng nhập' });
            }
        }
    }

    if (req.method === 'GET') {
        const { classId } = req.query;
        try {
            const students = await User.find({ classId, role: 'student' });
            return res.status(200).json(students.map((s: any) => ({
                id: s._id,
                fullName: s.fullName,
                username: s.username,
                role: s.role
            })));
        } catch (error) {
            console.error('Fetch students error:', error);
            return res.status(500).json({ error: 'Lỗi lấy danh sách học sinh' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
