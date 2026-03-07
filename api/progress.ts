import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb.js';
import { Progress } from '../src/data/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await dbConnect();
    } catch (dbError: any) {
        console.error('Progress DB connection error:', dbError);
        return res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu: ' + dbError.message });
    }

    if (req.method === 'GET') {
        const { userId, userIds } = req.query;

        // Hỗ trợ lấy nhiều tiến độ cùng lúc
        if (userIds) {
            const ids = (userIds as string).split(',');
            try {
                const results = await Progress.find({ userId: { $in: ids } }).lean();
                return res.status(200).json(results);
            } catch (error: any) {
                return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', details: error.message });
            }
        }

        if (!userId) return res.status(400).json({ error: 'userId is required' });

        try {
            const data = await Progress.findOne({ userId }).lean();
            if (data) return res.status(200).json(data);

            // Nếu không có dữ liệu, trả về object rỗng thay vì lỗi 404 để tránh báo đỏ console
            return res.status(200).json({ userId, points: 0, completedLessons: [] });
        } catch (error: any) {
            console.error('Progress fetch error:', error.message);
            return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', details: error.message });
        }
    }

    if (req.method === 'POST') {
        const { userId, ...progressData } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        // Làm sạch dữ liệu để tránh lỗi MongoDB
        delete (progressData as any)._id;
        delete (progressData as any).__v;

        try {
            console.log(`[API] Saving progress for user: ${userId}`);
            const updated = await Progress.findOneAndUpdate(
                { userId },
                { ...progressData, userId, lastActivity: new Date() },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            return res.status(200).json(updated);
        } catch (error: any) {
            console.error('Progress update error:', error.message);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
