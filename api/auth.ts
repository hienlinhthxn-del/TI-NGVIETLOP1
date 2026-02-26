import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb';
import { User } from '../src/data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await dbConnect();

    if (req.method === 'POST') {
        const { action, username, password, fullName, role, classId } = req.body;

        if (action === 'register') {
            try {
                // Check if user exists
                const existing = await User.findOne({ username });
                if (existing) return res.status(400).json({ error: 'Tài khoản đã tồn tại' });

                const newUser = new User({
                    username,
                    password, // Trong thực tế nên dùng bcrypt
                    fullName,
                    role: role || 'student',
                    classId: classId || '1A3'
                });

                await newUser.save();
                return res.status(201).json({ success: true, user: { username, fullName, role } });
            } catch (error) {
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
                return res.status(500).json({ error: 'Lỗi đăng nhập' });
            }
        }
    }

    if (req.method === 'GET') {
        // Lấy danh sách học sinh theo lớp (cho màn hình chọn tên)
        const { classId } = req.query;
        try {
            const students = await User.find({ classId, role: 'student' }, 'fullName username role');
            return res.status(200).json(students);
        } catch (error) {
            return res.status(500).json({ error: 'Lỗi lấy danh sách học sinh' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
}
