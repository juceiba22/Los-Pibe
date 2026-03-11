import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import Mux from '@mux/mux-node';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mux client setup
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

// For webhooks, we need raw body to verify signatures, but for simplicity here we just use json.
// Mux webhooks should ideally have their signatures verified.
app.use(express.json());
app.use(cors());

// 1. CREATE STREAM API
app.post('/api/create-stream', async (req, res) => {
  try {
    // call the Mux API to create a new live stream
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

    // 2. SAVE STREAM INFO IN SUPABASE
    // Update the `stream_estado` table (id = 1)
    const { error } = await supabase
      .from('stream_estado')
      .update({
        mux_stream_id: stream_id,
        mux_playback_id: playback_id,
        stream_key: stream_key,
        is_live: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Return the response as requested
    res.json({
      stream_id,
      stream_key,
      playback_id
    });
  } catch (err) {
    console.error('Error in /api/create-stream:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. MUX WEBHOOK HANDLER
app.post('/api/mux-webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook received:', event.type);

    if (event.type === 'video.live_stream.active') {
      console.log('Stream is active! Updating DB...');
      const { error } = await supabase
        .from('stream_estado')
        .update({ is_live: true, updated_at: new Date().toISOString() })
        .eq('id', 1);
        
      if (error) console.error('Supabase update active error:', error);
    } 
    else if (event.type === 'video.live_stream.idle') {
      console.log('Stream is idle! Updating DB...');
      const { error } = await supabase
        .from('stream_estado')
        .update({ is_live: false, updated_at: new Date().toISOString() })
        .eq('id', 1);
        
      if (error) console.error('Supabase update idle error:', error);
    }

    res.status(200).send('Webhook processado');
  } catch (err) {
    console.error('Error in /api/mux-webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
