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
    const { forum_id, user_id, reaction_type } = req.body;
    if (!forum_id || !user_id || !reaction_type) {
      return res.status(400).json({ error: 'forum_id, user_id and reaction_type are required' });
    }
    
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
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/forums/react:', err);
    return res.status(500).json({ error: err.message });
  }
}
