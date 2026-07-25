import Mux from '@mux/mux-node';
import { supabase, setCorsHeaders } from './_utils.js';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, titulo, escenario_id } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Call Mux API to create a live stream
    const stream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
      generated_subtitles: [{ name: 'English', passthrough: 'English', language_code: 'en' }]
    });

    const stream_id = stream.id;
    const stream_key = stream.stream_key;
    const playback_id = stream.playback_ids?.[0]?.id;

    if (!playback_id) {
      throw new Error('Playback ID was not generated');
    }

    // Insert stream row in Supabase using the service role client
    const { data, error } = await supabase
      .from('streams')
      .insert([{
        created_by: userId,
        titulo: titulo || 'Transmisión Privada',
        is_live: false,
        mux_stream_id: stream_id,
        mux_playback_id: playback_id,
        stream_key: stream_key,
        escenario_id: escenario_id || 'estadio'
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/create-stream serverless function:', err);
    return res.status(500).json({ error: err.message });
  }
}
