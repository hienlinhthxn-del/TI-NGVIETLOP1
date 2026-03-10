import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const { recordingId } = req.query;

    if (!recordingId) {
        return res.status(400).json({ error: "Recording ID is required" });
    }

    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dx8v9vuxo";

    // Chuyển hướng tới URL audio trên Cloudinary với định dạng .mp4 để tương thích tốt nhất trên iOS và mọi trình duyệt
    const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${recordingId}.mp4`;

    console.log(`[Audio] Redirecting ${recordingId} to ${audioUrl}`);
    res.redirect(audioUrl);
}
