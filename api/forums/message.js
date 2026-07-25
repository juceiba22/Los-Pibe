import { supabase, setCorsHeaders, checkRateLimit, ensureParticipant } from '../_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { forum_id, user_id, message_text } = req.body;
    if (!forum_id || !user_id || !message_text) {
      return res.status(400).json({ error: 'forum_id, user_id and message_text are required' });
    }
    
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
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/forums/message:', err);
    return res.status(500).json({ error: err.message });
  }
}
