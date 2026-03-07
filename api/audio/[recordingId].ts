import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const { recordingId } = req.query;

    if (!recordingId) {
        return res.status(400).json({ error: "Recording ID is required" });
    }

    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";

    // Chuyển hướng tới URL audio trên Cloudinary
    // Thêm resource_type=video ngầm định qua path /video/
    // Thêm f_auto,q_auto để tối ưu hóa việc tải và tương thích
    const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${recordingId}.mp3`;

    res.redirect(audioUrl);
}
