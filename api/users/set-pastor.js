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
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

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
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/users/set-pastor:', err);
    return res.status(500).json({ error: err.message });
  }
}
