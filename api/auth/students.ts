import type { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../../src/services/mongodb';
import { User } from '../../src/data/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Thêm headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await dbConnect();
        const { classId } = req.query;

        // Mặc định classId là 1A3 nếu không truyền vào
        const targetClassId = classId || '1A3';

        console.log(`Fetching students for class: ${targetClassId}`);
        const students = await User.find({ classId: targetClassId, role: 'student' })
            .select('_id fullName username role')
            .limit(50)
            .lean();

        return res.status(200).json(students.map((s: any) => ({
            id: s._id,
            fullName: s.fullName,
            username: s.username,
            role: s.role
        })));
    } catch (error: any) {
        console.error('Fetch students error:', error.message);
        return res.status(500).json({ error: 'FETCH_STUDENTS_ERROR', details: error.message });
    }
}
