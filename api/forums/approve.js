import { supabase, setCorsHeaders } from '../_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { forum_id } = req.body;
    if (!forum_id) {
      return res.status(400).json({ error: 'forum_id is required' });
    }
    
    const { data: forum, error: fetchError } = await supabase
      .from('forums')
      .select('duration_seconds')
      .eq('id', forum_id)
      .single();
      
    if (fetchError) throw fetchError;
    
    const approved_at = new Date();
    const expires_at = new Date(approved_at.getTime() + (forum.duration_seconds || 300) * 1000);
    
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
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/forums/approve:', err);
    return res.status(500).json({ error: err.message });
  }
}
