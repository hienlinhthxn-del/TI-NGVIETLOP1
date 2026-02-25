import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import Progress from '../../models/Progress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    // Dùng để LƯU tiến độ từ client lên server
    try {
      const { userId, ...progressData } = req.body;
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      // Tìm và cập nhật (hoặc tạo mới nếu chưa có)
      const updatedProgress = await Progress.findOneAndUpdate(
        { userId: userId },
        { ...progressData, userId },
        { new: true, upsert: true } // upsert: true sẽ tạo mới nếu không tìm thấy
      );

      res.status(200).json(updatedProgress);
    } catch (error) {
      console.error('API Progress POST Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'GET') {
    // Dùng để TẢI tiến độ từ server về client (khi đổi máy, hoặc lần đầu đăng nhập)
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      const progress = await Progress.findOne({ userId: userId as string });
      if (!progress) {
        return res.status(404).json({ message: 'Progress not found' });
      }
      res.status(200).json(progress);
    } catch (error) {
      console.error('API Progress GET Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}