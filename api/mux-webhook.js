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
    const playbackId = event.data?.playback_ids?.[0]?.id;

    console.log(`Mux Webhook Payload Details - Stream ID: ${muxStreamId}, Playback ID: ${playbackId}`);

    if (!muxStreamId) {
      return res.status(400).send('No stream id found in payload');
    }

    const isLive = event.type === 'video.live_stream.active';

    if (event.type === 'video.live_stream.active' || event.type === 'video.live_stream.idle') {
      console.log(`Stream ${muxStreamId} is changing status to ${isLive ? 'active' : 'idle'}! Updating DB...`);
      
      let updateQuery = supabase
        .from('streams')
        .update({ 
          is_live: isLive, 
          updated_at: new Date().toISOString(),
          // Se actualiza playback_id si es active para asegurar sincronizacion
          ...(isLive && playbackId ? { mux_playback_id: playbackId } : {})
        });

      // Intentar buscar por mux_stream_id OR por mux_playback_id
      if (playbackId) {
        updateQuery = updateQuery.or(`mux_stream_id.eq.${muxStreamId},mux_playback_id.eq.${playbackId}`);
      } else {
        updateQuery = updateQuery.eq('mux_stream_id', muxStreamId);
      }

      const { data, error } = await updateQuery;
      
      if (error) {
        console.error('Supabase update status error:', error);
        throw error;
      } else {
        console.log(`Supabase status updated successfully to is_live=${isLive}`);
      }
    }

    return res.status(200).send('Webhook processado');
  } catch (err) {
    console.error('Error in /api/mux-webhook serverless function:', err);
    return res.status(500).json({ error: err.message });
  }
}
