import { supabase, setCorsHeaders, ensureParticipant } from '../_utils.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { forum_id, user_id, vote } = req.body;
    if (!forum_id || !user_id || vote === undefined) {
      return res.status(400).json({ error: 'forum_id, user_id and vote are required' });
    }
    
    await ensureParticipant(forum_id, user_id);
    
    const { data: voteData, error: voteError } = await supabase
      .from('forum_votes')
      .insert({ forum_id, user_id, vote })
      .select()
      .single();
      
    if (voteError) {
      if (voteError.code === '23505') {
        return res.status(400).json({ error: 'User already voted.' });
      }
      throw voteError;
    }
    
    const { count: yesVotes } = await supabase
      .from('forum_votes')
      .select('*', { count: 'exact', head: true })
      .eq('forum_id', forum_id)
      .eq('vote', true);
      
    const { data: forum } = await supabase
      .from('forums')
      .select('participant_count')
      .eq('id', forum_id)
      .single();
      
    if (forum && yesVotes !== null && yesVotes > (forum.participant_count || 0) / 2) {
      await supabase
        .from('forums')
        .update({ status: 'achieved', closed_at: new Date().toISOString() })
        .eq('id', forum_id);
    }
      
    return res.status(200).json(voteData);
  } catch (err) {
    console.error('Error in /api/forums/vote:', err);
    return res.status(500).json({ error: err.message });
  }
}
