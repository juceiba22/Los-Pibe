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
    
    const { data, error } = await supabase
      .from('forums')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', forum_id)
      .select()
      .single();
      
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/forums/close:', err);
    return res.status(500).json({ error: err.message });
  }
}
