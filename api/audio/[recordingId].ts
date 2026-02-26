import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const { recordingId } = req.query;

    if (!recordingId) {
        return res.status(400).json({ error: "Recording ID is required" });
    }

    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";

    // Chuyển hướng tới URL audio trên Cloudinary
    // Thêm .mp3 để Cloudinary tự động chuyển đổi định dạng giúp trình duyệt nào cũng nghe được
    const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${recordingId}.mp3`;

    res.redirect(audioUrl);
}
