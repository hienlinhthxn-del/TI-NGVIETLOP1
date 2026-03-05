import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb.js';
import { Progress } from '../src/data/models.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await dbConnect();
    } catch (dbError: any) {
        console.error('Leaderboard DB connection error:', dbError);
        return res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu: ' + dbError.message });
    }

    if (req.method === 'GET') {
        try {
            // Lấy top 10 người dùng có điểm cao nhất
            // Lưu ý: ProgressSchema không có field 'role', không cần filter role
            const players = await Progress.find({})
                .sort({ points: -1 })
                .limit(10);

            const formatted = players.map((p: any) => ({
                username: p.username,
                points: p.points,
                lessons_completed: (p.completedLessons || []).length
            }));

            return res.status(200).json(formatted);
        } catch (error) {
            console.error('Leaderboard fetch error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { username, points, lessonsCompleted } = req.body || {};
            if (!username) return res.status(400).json({ error: 'Username required' });

            // Upsert progress record
            await Progress.findOneAndUpdate(
                { userId: username },
                {
                    $set: {
                        username,
                        points,
                        completedLessons: Array(lessonsCompleted || 0).fill(''),
                        lastActivity: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Leaderboard update error:', error);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
