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
    const { userId, titulo, escenario_id } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

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
    // Insert a new stream row in the `streams` table
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

    // Return the full created stream row
    res.json(data);
  } catch (err) {
    console.error('Error in /api/create-stream:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1.5 WHIP PROXY API (to avoid CORS browser issues locally)
app.post('/api/whip', async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { 
        body = JSON.parse(body); 
      } catch (e) {
        // ignore
      }
    }

    const streamKey = body?.streamKey?.trim();
    const sdp = body?.sdp;

    if (!streamKey || !sdp) {
      console.error('Faltan parámetros en /api/whip:', { hasStreamKey: !!streamKey, hasSdp: !!sdp });
      return res.status(400).json({ error: 'streamKey y sdp son requeridos' });
    }

    const cleanStreamKey = streamKey.replace(/\s+/g, '');
    const muxWhipUrl = `https://global.whip.mux.com/app/${cleanStreamKey}`;
    console.log(`Iniciando conexión WHIP local a Mux con streamKey: ${cleanStreamKey.substring(0, 6)}...`);

    const response = await fetch(muxWhipUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp'
      },
      body: sdp
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Mux WHIP local rechazó la oferta (${response.status}):`, errText);
      return res.status(response.status).send(errText || 'Error en servidor WHIP Mux');
    }

    const answerSdp = await response.text();
    res.setHeader('Content-Type', 'text/plain');
    res.status(201).send(answerSdp);
  } catch (err) {
    console.error('Error detallado en /api/whip local:', err, err.cause);
    const detail = err.cause ? `${err.message} (${err.cause})` : err.message;
    res.status(500).json({ error: detail });
  }
});

// 2. MUX WEBHOOK HANDLER
app.post('/api/mux-webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook received:', event.type);
    const muxStreamId = event.data?.id;

    if (!muxStreamId) {
      return res.status(450).send('No stream id found in payload');
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

    res.status(200).send('Webhook processado');
  } catch (err) {
    console.error('Error in /api/mux-webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET ACTIVE STREAMS
app.get('/api/streams/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('is_live', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error in /api/streams/active:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. GET USER STREAMS
app.get('/api/streams/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error in /api/streams/user:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- TEMPORARY COMMUNITY FORUMS ENDPOINTS ---

// Check rate limits helper
const rateLimits = {};
const checkRateLimit = (action, userId, maxCount, timeWindowMs) => {
  const now = Date.now();
  if (!rateLimits[userId]) rateLimits[userId] = {};
  if (!rateLimits[userId][action]) rateLimits[userId][action] = [];
  
  // clean up old requests
  rateLimits[userId][action] = rateLimits[userId][action].filter(time => now - time < timeWindowMs);
  
  if (rateLimits[userId][action].length >= maxCount) {
    return false;
  }
  rateLimits[userId][action].push(now);
  return true;
};

// Helper to track and update participant count efficiently
const ensureParticipant = async (forum_id, user_id) => {
  const { error } = await supabase
    .from('forum_participants')
    .insert({ forum_id, user_id });
    
  if (!error) {
    const { data: forum } = await supabase.from('forums').select('participant_count').eq('id', forum_id).single();
    if (forum) {
      await supabase.from('forums').update({ participant_count: forum.participant_count + 1 }).eq('id', forum_id);
    }
  }
};

app.post('/api/users/set-pastor', async (req, res) => {
  try {
    const { username } = req.body;
    
    const { data: profile, error: fetchError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('username', username)
      .single();
      
    if (fetchError || !profile) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const { data, error } = await supabase
      .from('perfiles')
      .update({ rol: 'pastor' })
      .eq('id', profile.id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forums/create', async (req, res) => {
  try {
    const { topic, objective, created_by, duration_seconds } = req.body;
    
    const { data, error } = await supabase
      .from('forums')
      .insert({ topic, objective, created_by, duration_seconds, status: 'pending_approval' })
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forums/approve', async (req, res) => {
  try {
    const { forum_id } = req.body;
    
    const { data: forum, error: fetchError } = await supabase
      .from('forums')
      .select('duration_seconds')
      .eq('id', forum_id)
      .single();
      
    if (fetchError) throw fetchError;
    
    const approved_at = new Date();
    const expires_at = new Date(approved_at.getTime() + forum.duration_seconds * 1000);
    
    const { data, error } = await supabase
      .from('forums')
      .update({
        status: 'active',
        approved_at: approved_at.toISOString(),
        expires_at: expires_at.toISOString()
      })
      .eq('id', forum_id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forums/close', async (req, res) => {
  try {
    const { forum_id } = req.body;
    
    const { data, error } = await supabase
      .from('forums')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', forum_id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forums/message', async (req, res) => {
  try {
    const { forum_id, user_id, message_text } = req.body;
    
    // max 5 messages every 10 seconds
    if (!checkRateLimit('message', user_id, 5, 10000)) {
      return res.status(429).json({ error: 'Too many messages. Please wait.' });
    }
    
    await ensureParticipant(forum_id, user_id);
    
    const { data, error } = await supabase
      .from('forum_messages')
      .insert({ forum_id, user_id, message_text })
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forums/react', async (req, res) => {
  try {
    const { forum_id, user_id, reaction_type } = req.body;
    
    const isSticker = reaction_type.startsWith('sticker_');
    const limitMax = isSticker ? 1 : 3;
    const limitTime = isSticker ? 10000 : 5000;
    const rateLimitAction = isSticker ? 'sticker' : 'reaction';
    
    if (!checkRateLimit(rateLimitAction, user_id, limitMax, limitTime)) {
      return res.status(429).json({ error: 'Too many reactions. Please wait.' });
    }
    
    await ensureParticipant(forum_id, user_id);
    
    const { data, error } = await supabase
      .from('forum_reactions')
      .insert({ forum_id, user_id, reaction_type })
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forums/vote', async (req, res) => {
  try {
    const { forum_id, user_id, vote } = req.body;
    
    await ensureParticipant(forum_id, user_id);
    
    const { data: voteData, error: voteError } = await supabase
      .from('forum_votes')
      .insert({ forum_id, user_id, vote })
      .select()
      .single();
      
    if (voteError) {
      if (voteError.code === '23505') return res.status(400).json({ error: 'User already voted.' });
      throw voteError;
    }
    
    const { count: yesVotes } = await supabase
      .from('forum_votes')
      .select('*', { count: 'exact', head: true })
      .eq('forum_id', forum_id)
      .eq('vote', true);
      
    const { data: forum } = await supabase.from('forums').select('participant_count').eq('id', forum_id).single();
      
    if (forum && yesVotes !== null && yesVotes > forum.participant_count / 2) {
      await supabase.from('forums').update({ status: 'achieved', closed_at: new Date().toISOString() }).eq('id', forum_id);
    }
      
    res.json(voteData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Background job for forum expiration
setInterval(async () => {
  try {
    const now = new Date().toISOString();
    const { data: expiredForums } = await supabase
      .from('forums')
      .select('id')
      .eq('status', 'active')
      .lt('expires_at', now);
      
    if (expiredForums && expiredForums.length > 0) {
      const ids = expiredForums.map(f => f.id);
      await supabase
        .from('forums')
        .update({ status: 'expired', closed_at: now })
        .in('id', ids);
    }
  } catch (err) {
    console.error('Error in forum expiration job:', err);
  }
}, 5000);
// --- END TEMPORARY FORUMS ENDPOINTS ---

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
