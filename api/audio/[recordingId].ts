import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { recordingId } = req.query;

  if (!recordingId) {
    return res.status(400).json({ error: 'Recording ID is required' });
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dx8v9vuxo';
  const audioUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${recordingId}.mp4`;

  try {
    console.log(`[Audio] Proxying ${recordingId} from ${audioUrl}`);

    const fetchRes = await fetch(audioUrl);
    if (!fetchRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch from cloud provider' });
    }

    const contentType = fetchRes.headers.get('content-type') || 'audio/mp4';
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set CORS so mobile webviews and cross-origin contexts can play
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buffer.length));

    // Stream the file to the client
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[Audio] Proxy error:', err);
    res.status(500).json({ error: 'Internal server error while proxying audio' });
  }
}
