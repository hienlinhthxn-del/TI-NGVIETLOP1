import { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb.js';
import { Lesson } from '../src/data/models.js';
import { lessons as initialLessons } from '../src/data/lessons.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            let lessons = await Lesson.find({}).sort({ id: 1 });

            // Nếu CSDL rỗng, tự động nạp dữ liệu từ file tĩnh vào
            if (lessons.length === 0) {
                console.log("Database rỗng, đang nạp dữ liệu mẫu...");
                await Lesson.insertMany(initialLessons);
                lessons = await Lesson.find({}).sort({ id: 1 });
            }

            return res.status(200).json(lessons);
        } catch (error) {
            return res.status(500).json({ error: 'Lỗi khi tải bài học' });
        }
    }

    if (req.method === 'POST') {
        // Chỉ cho phép giáo viên/admin sửa bài học (kiểm tra role ở frontend/hoặc token nếu có)
        // Hiện tại ta tạm tin tưởng request từ giao diện giáo viên
        const { id, updates } = req.body;

        try {
            const updatedLesson = await Lesson.findOneAndUpdate(
                { id },
                { ...updates, updatedAt: new Date() },
                { new: true, upsert: true }
            );
            return res.status(200).json(updatedLesson);
        } catch (error) {
            return res.status(500).json({ error: 'Lỗi khi cập nhật bài học' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
