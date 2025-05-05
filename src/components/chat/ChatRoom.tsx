
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

export const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(roomId === 'new');

  // Check if roomId is "new" and handle new room creation
  useEffect(() => {
    if (roomId === 'new' && user) {
      createNewChatRoom();
    }
  }, [roomId, user]);

  const createNewChatRoom = async () => {
    if (!user) return;
    
    try {
      setIsCreatingRoom(true);
      setIsLoading(true);
      const newRoomName = `Chat Room ${new Date().toLocaleDateString()}`;
      
      console.log('Creating new chat room with name:', newRoomName);
      
      // Insert new chat room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([
          { name: newRoomName, created_by: user.id }
        ])
        .select()
        .single();
      
      if (roomError) {
        console.error('Error creating chat room:', roomError);
        throw roomError;
      }
      
      console.log('Created chat room:', roomData);
      
      if (!roomData || !roomData.id) {
        throw new Error('Failed to retrieve the created chat room data');
      }
      
      // Add the creator as a participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: roomData.id, user_id: user.id }
        ]);
      
      if (participantError) {
        console.error('Error adding participant:', participantError);
        throw participantError;
      }
      
      // Navigate to the new room
      navigate(`/chat/${roomData.id}`, { replace: true });
      
      toast({
        title: "Success",
        description: "New chat room created successfully",
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: "Failed to create chat room. Please try again.",
        variant: "destructive"
      });
      navigate('/chat');
    } finally {
      setIsLoading(false);
      setIsCreatingRoom(false);
    }
  };

  useEffect(() => {
    if (!roomId || roomId === 'new' || !user) return;

    const fetchChatData = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is a participant, if not add them
        const { data: participantData, error: participantCheckError } = await supabase
          .from('chat_participants')
          .select('id')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (participantCheckError) {
          console.error('Error checking participant:', participantCheckError);
        }
        
        // If user is not a participant, add them
        if (!participantData) {
          const { error: addParticipantError } = await supabase
            .from('chat_participants')
            .insert([{ room_id: roomId, user_id: user.id }]);
          
          if (addParticipantError) {
            console.error('Error adding participant:', addParticipantError);
          }
        }
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('sent_at');

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }
        
        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        toast({
          title: "Error",
          description: "Failed to load chat room data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, toast]);

  if (isCreatingRoom) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-xl mb-4">Creating new chat room...</h2>
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <ChatHeader roomId={roomId} isLoading={isLoading} />
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput roomId={roomId} />
    </div>
  );
};
