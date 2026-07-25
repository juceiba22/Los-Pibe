import { setCorsHeaders } from './_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { streamKey, sdp } = req.body;
    if (!streamKey || !sdp) {
      return res.status(400).json({ error: 'streamKey y sdp son requeridos' });
    }

    const cleanStreamKey = streamKey.trim().replace(/\s+/g, '');

    // Server-to-server POST to Mux WHIP endpoint bypassing browser CORS
    const response = await fetch(`https://global.whip.mux.com/app/${cleanStreamKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: sdp
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(errText);
    }

    const answerSdp = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(answerSdp);
  } catch (err) {
    console.error('Error in /api/whip proxy serverless function:', err);
    return res.status(500).json({ error: err.message });
  }
}
