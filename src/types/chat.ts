
export interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_text?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file' | 'voice';
  sent_at: string;
}
