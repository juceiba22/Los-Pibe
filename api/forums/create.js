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
    const { topic, objective, created_by, duration_seconds } = req.body;
    if (!topic || !created_by) {
      return res.status(400).json({ error: 'topic and created_by are required' });
    }

    const { data, error } = await supabase
      .from('forums')
      .insert({ topic, objective, created_by, duration_seconds, status: 'pending_approval' })
      .select()
      .single();
      
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/forums/create:', err);
    return res.status(500).json({ error: err.message });
  }
}
