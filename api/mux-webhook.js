import { supabase, setCorsHeaders } from './_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('Webhook received in serverless function:', event.type);
    const muxStreamId = event.data?.id;

    if (!muxStreamId) {
      return res.status(400).send('No stream id found in payload');
    }

    if (event.type === 'video.live_stream.active') {
      console.log(`Stream ${muxStreamId} is active! Updating DB...`);
      const { error } = await supabase
        .from('streams')
        .update({ is_live: true, updated_at: new Date().toISOString() })
        .eq('mux_stream_id', muxStreamId);
        
      if (error) console.error('Supabase update active error:', error);
    } 
    else if (event.type === 'video.live_stream.idle') {
      console.log(`Stream ${muxStreamId} is idle! Updating DB...`);
      const { error } = await supabase
        .from('streams')
        .update({ is_live: false, updated_at: new Date().toISOString() })
        .eq('mux_stream_id', muxStreamId);
        
      if (error) console.error('Supabase update idle error:', error);
    }

    return res.status(200).send('Webhook processado');
  } catch (err) {
    console.error('Error in /api/mux-webhook serverless function:', err);
    return res.status(500).json({ error: err.message });
  }
}
