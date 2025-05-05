
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ChatHeaderProps {
  roomId: string | undefined;
  isLoading: boolean;
}

export function ChatHeader({ roomId, isLoading }: ChatHeaderProps) {
  const [roomName, setRoomName] = useState('Chat Room');
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId || roomId === 'new') return;
    
    const fetchRoomName = async () => {
      try {
        // Get room name
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('name')
          .eq('id', roomId)
          .single();
          
        if (roomError) {
          console.error('Error fetching room details:', roomError);
          throw roomError;
        }
        
        if (roomData) setRoomName(roomData.name);
      } catch (error) {
        console.error('Error fetching chat room name:', error);
      }
    };

    fetchRoomName();
  }, [roomId]);

  return (
    <div className="border-b p-3 bg-muted/20">
      <h2 className="text-xl font-semibold">{roomName || 'Chat Room'}</h2>
    </div>
  );
}
