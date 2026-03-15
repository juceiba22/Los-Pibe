export type ForumStatus = 'pending_approval' | 'active' | 'closed' | 'expired' | 'achieved';

export interface Forum {
  id: string;
  topic: string;
  objective: string;
  created_by: string;
  stream_id: number;
  status: ForumStatus;
  duration_seconds: number;
  created_at: string;
  expires_at: string | null;
  approved_at: string | null;
  closed_at: string | null;
  participant_count: number;
}

export interface ForumMessage {
  id: string;
  forum_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
}

export interface ForumReaction {
  id: string;
  forum_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface ForumVote {
  id: string;
  forum_id: string;
  user_id: string;
  vote: boolean;
  created_at: string;
}
