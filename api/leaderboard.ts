import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../services/mongodb';
import { Progress } from '../../data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            // Lấy danh sách học sinh có điểm cao nhất
            const players = await Progress.find({ role: 'student' })
                .sort({ points: -1 })
                .limit(10)
                .select('username points completedLessons');

            const formatted = players.map(p => ({
                username: p.username,
                points: p.points,
                lessons_completed: p.completedLessons.length
            }));

            return res.status(200).json(formatted);
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
