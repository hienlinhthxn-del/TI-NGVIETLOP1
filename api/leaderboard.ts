import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../src/services/mongodb';
import { Progress } from '../src/data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await dbConnect();
    } catch (dbError: any) {
        console.error('Leaderboard DB connection error:', dbError);
        return res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu: ' + dbError.message });
    }

    if (req.method === 'GET') {
        try {
            // Lấy danh sách học sinh có điểm cao nhất
            const players = await Progress.find({ role: 'student' })
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

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
