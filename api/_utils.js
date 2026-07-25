import { createClient } from '@supabase/supabase-js';

// Defensivo logging for Vercel logs verification
console.log('VITE_SUPABASE_URL presente:', !!process.env.VITE_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY presente:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing.');
}

// Lazy initialization using a Proxy to prevent crashes on module import time
let supabaseInstance = null;
export const supabase = new Proxy({}, {
  get(target, prop) {
    if (!supabaseInstance) {
      const url = process.env.VITE_SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (!url || !key) {
        throw new Error('Supabase URL or Service Role Key is missing in environment variables.');
      }
      supabaseInstance = createClient(url, key);
    }
    return supabaseInstance[prop];
  }
});

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

// Simple in-memory rate limiter per serverless container instance
const rateLimits = {};
export function checkRateLimit(action, userId, maxCount, timeWindowMs) {
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
}

export async function ensureParticipant(forum_id, user_id) {
  const { error } = await supabase
    .from('forum_participants')
    .insert({ forum_id, user_id });
    
  if (!error) {
    const { data: forum } = await supabase.from('forums').select('participant_count').eq('id', forum_id).single();
    if (forum) {
      await supabase.from('forums').update({ participant_count: (forum.participant_count || 0) + 1 }).eq('id', forum_id);
    }
  }
}
