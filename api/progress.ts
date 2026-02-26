import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../services/mongodb';
import { Progress } from '../../data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        try {
            const data = await Progress.findOne({ userId });
            if (data) return res.status(200).json(data);
            return res.status(404).json({ error: 'Progress not found' });
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    if (req.method === 'POST') {
        const { userId, ...progressData } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        try {
            const updated = await Progress.findOneAndUpdate(
                { userId },
                { ...progressData, userId, lastActivity: new Date() },
                { upsert: true, new: true }
            );
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
