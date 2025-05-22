import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paperclip, Send, Mic } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';

export const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(roomId === 'new');
  const [roomName, setRoomName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

    const fetchRoomDetails = async () => {
      try {
        setIsLoading(true);
        
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
        scrollToBottom();
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

    fetchRoomDetails();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Check for duplicate messages
            const messageExists = prev.some(m => m.id === newMessage.id);
            if (messageExists) return prev;
            return [...prev, newMessage];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, toast]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !roomId || roomId === 'new') return;

    const tempId = uuidv4();
    const messageData = {
      id: tempId,
      room_id: roomId,
      sender_id: user.id,
      message_text: newMessage,
      sent_at: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    try {
      setIsLoading(true);
      
      console.log('Sending message to room:', roomId);
      
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          sender_id: user.id,
          message_text: newMessage
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageData.message_text);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !roomId || roomId === 'new') return;

    try {
      setIsLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      // Create storage bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'chat_attachments')) {
        await supabase.storage.createBucket('chat_attachments', {
          public: true
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);

      // Determine attachment type based on file.type
      let attachmentType: string = 'file';
      if (file.type.startsWith('image/')) {
        attachmentType = 'image';
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          sender_id: user.id,
          attachment_url: data.publicUrl,
          attachment_type: attachmentType
        }]);
        
      if (error) throw error;

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Voice recording is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleVoiceUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      const errorMessage = 
        error instanceof Error && error.name === 'NotAllowedError'
          ? "Please allow microphone access to record voice messages"
          : error instanceof Error && error.name === 'NotFoundError'
          ? "No microphone found. Please connect a microphone and try again"
          : "Could not start voice recording";

      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceUpload = async (audioBlob: Blob) => {
    if (!user || !roomId || roomId === 'new') return;

    const tempId = uuidv4();
    const messageData = {
      id: tempId,
      room_id: roomId,
      sender_id: user.id,
      attachment_type: 'voice',
      sent_at: new Date().toISOString()
    };

    // Optimistic update for voice message
    setMessages(prev => [...prev, messageData]);

    try {
      setIsLoading(true);
      const fileName = `${uuidv4()}.webm`;
      const filePath = `${roomId}/${fileName}`;

      // Create storage bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'chat_attachments')) {
        await supabase.storage.createBucket('chat_attachments', {
          public: true
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, audioBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          attachment_url: data.publicUrl,
          attachment_type: 'voice'
        });
        
      if (error) throw error;

    } catch (error) {
      // Remove optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Error uploading voice message:', error);
      toast({
        title: "Error",
        description: "Failed to upload voice message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loading size="lg" text="Loading chat..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="border-b p-3 bg-muted/20">
        <h2 className="text-xl font-semibold">{roomName || 'Chat Room'}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                {message.message_text && <p>{message.message_text}</p>}
                {message.attachment_url && message.attachment_type === 'image' && (
                  <img src={message.attachment_url} alt="Attachment" className="max-w-full rounded" />
                )}
                {message.attachment_url && message.attachment_type === 'voice' && (
                  <audio controls src={message.attachment_url} className="max-w-full" />
                )}
                {message.attachment_url && message.attachment_type === 'file' && (
                  <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    Download File
                  </a>
                )}
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.sent_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading}
          />
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? 'animate-pulse bg-red-100' : ''}
            disabled={isLoading && !isRecording}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !newMessage.trim()}
            className="bg-scriptsense-primary hover:bg-blue-800"
          >
            {isLoading ? (
              <Loading size="sm" className="mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
