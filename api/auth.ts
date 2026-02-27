import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb';
import { User } from '../src/data/models';

/**
 * Endpoint xử lý Xác thực (Authentication) trên Vercel:
 * - POST /api/auth (action: login, register)
 * - GET /api/auth?seed=1 (Khởi tạo dữ liệu mẫu)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 0. Thêm test param để kiểm tra server có phản hồi nhanh không
    if (req.query.test) {
        return res.status(200).json({
            status: 'ok',
            message: 'Serverless function is reachable',
            time: new Date().toISOString()
        });
    }

    // 1. Kết nối DB
    try {
        await dbConnect();
    } catch (dbError: any) {
        console.error('API Error: DB Connection failed', dbError.message);
        return res.status(500).json({
            success: false,
            error: 'Lỗi kết nối CSDL (DB_CONNECTION_ERROR)',
            details: dbError.message
        });
    }

    // 2. Trigger tạo dữ liệu mẫu (Truy cập: /api/auth?seed=1)
    if (req.query.seed) {
        try {
            const results: any = {};

            // 2.1 Tạo Admin nếu chưa có
            let admin = await User.findOne({ username: 'admin' });
            if (!admin) {
                admin = new User({
                    username: 'admin',
                    password: 'admin123',
                    role: 'teacher',
                    fullName: 'Giáo Viên Quản Trị',
                    classId: '1A3'
                });
                await admin.save();
                results.admin = 'created';
            } else {
                results.admin = 'exists';
            }

            // 2.2 Tạo Phụ huynh mẫu nếu chưa có
            let parent = await User.findOne({ username: 'parent' });
            if (!parent) {
                parent = new User({
                    username: 'parent',
                    password: '123456',
                    role: 'parent',
                    fullName: 'Phụ Huynh Mẫu',
                    classId: '1A3'
                });
                await parent.save();
                results.parent = 'created';
            } else {
                results.parent = 'exists';
            }

            // 2.3 Tạo danh sách học sinh mặc định nếu chưa có ai
            const studentCount = await User.countDocuments({ role: 'student' });
            if (studentCount === 0) {
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
                results.students = `created ${studentsData.length} students`;
            } else {
                results.students = `exists (${studentCount} students)`;
            }

            return res.status(200).json({ success: true, results });
        } catch (e: any) {
            console.error('API Error: Seeding failed', e.message);
            return res.status(500).json({ error: 'SEED_ERROR', details: e.message });
        }
    }

    // 3. Xử lý POST (Login / Register)
    if (req.method === 'POST') {
        const { action, username, password, fullName, role, classId } = req.body || {};

        if (!action) {
            return res.status(400).json({ error: 'Missing action (login/register)' });
        }

        if (action === 'register') {
            try {
                if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

                const existing = await User.findOne({ username });
                if (existing) return res.status(400).json({ error: 'Tài khoản đã tồn tại' });

                const newUser = new User({
                    username,
                    password, // Trong thực tế nên được mã hóa (bcrypt)
                    fullName: fullName || 'Học sinh mới',
                    role: role || 'student',
                    classId: classId || '1A3'
                });

                await newUser.save();
                return res.status(201).json({ success: true, message: 'Đăng ký thành công' });
            } catch (error: any) {
                console.error('API Error: Register failed', error.message);
                return res.status(500).json({ error: 'REGISTER_ERROR', details: error.message });
            }
        }

        if (action === 'login') {
            try {
                if (!username) return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập' });

                // Lưu ý: HS đăng nhập không có mật khẩu (password='')
                const user = await User.findOne({
                    username: username,
                    password: password || ''
                });

                if (!user) {
                    return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
                }

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
                console.error('API Error: Login failed', error.message);
                return res.status(500).json({
                    error: 'LOGIN_ERROR',
                    details: error.message
                });
            }
        }
    }

    // Mặc định trả về 405 nếu method khác không được hỗ trợ ở đây
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
