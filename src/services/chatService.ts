
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom, ChatMessage, ChatParticipant } from '@/types/chat';

// Function to create a new chat room
export async function createChatRoom(name: string): Promise<ChatRoom | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Insert new chat room
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add current user as participant
    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert({
        room_id: data.id,
        user_id: user.id
      });

    if (participantError) throw participantError;

    return data;
  } catch (error) {
    console.error('Error creating chat room:', error);
    return null;
  }
}

// Function to get all chat rooms the current user participates in
export async function getUserChatRooms(): Promise<ChatRoom[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get rooms where the user is a participant
    const { data, error } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    const roomIds = data.map(participant => participant.room_id);
    
    if (roomIds.length === 0) return [];
    
    // Get the actual room data
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', roomIds)
      .order('created_at', { ascending: false });
    
    if (roomsError) throw roomsError;
    
    return rooms || [];
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return [];
  }
}

// Function to send a message to a chat room
export async function sendMessage(roomId: string, messageText: string): Promise<ChatMessage | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First check if user is a participant
    const { data: isParticipant, error: participantError } = await supabase
      .rpc('is_room_participant', { room_id: roomId });
    
    if (participantError) throw participantError;
    
    if (!isParticipant) {
      throw new Error('You are not a participant in this chat room');
    }
    
    // Insert message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        message_text: messageText
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

// Function to get messages from a chat room
export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    // Get messages for the room
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('sent_at', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
}

// Function to add a participant to a chat room
export async function addParticipant(roomId: string, userId: string): Promise<ChatParticipant | null> {
  try {
    // Check if the user is already a participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingParticipant) {
      return existingParticipant; // Already a participant
    }
    
    // Add the user as participant
    const { data, error } = await supabase
      .from('chat_participants')
      .insert({
        room_id: roomId,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error adding participant:', error);
    return null;
  }
}
