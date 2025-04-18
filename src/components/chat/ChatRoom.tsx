
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paperclip, Send, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      setIsLoading(true);
      const roomName = `Chat Room ${new Date().toLocaleDateString()}`;
      
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomName,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Add the creator as a participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomData.id,
          user_id: user?.id
        });
      
      if (participantError) throw participantError;
      
      // Navigate to the new room
      navigate(`/chat/${roomData.id}`, { replace: true });
      
      toast({
        title: "Success",
        description: "New chat room created",
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
    }
  };

  useEffect(() => {
    if (!roomId || roomId === 'new' || !user) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('sent_at');

        if (error) throw error;

        // Cast data to ChatMessage[] to ensure type compatibility
        setMessages(data as ChatMessage[]);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_messages_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Cast new message to ChatMessage to ensure type compatibility
          setMessages(prev => [...prev, payload.new as ChatMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !roomId || roomId === 'new') return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          message_text: newMessage
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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
        .insert({
          room_id: roomId,
          sender_id: user.id,
          attachment_url: data.publicUrl,
          attachment_type: attachmentType
        });
        
      if (error) throw error;

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
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
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
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

    try {
      setIsLoading(true);
      const fileName = `${Math.random()}.webm`;
      const filePath = `${roomId}/${fileName}`;

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

  if (roomId === 'new') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-xl mb-4">Creating new chat room...</h2>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
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
        ))}
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
          <Button onClick={handleSendMessage} disabled={isLoading || !newMessage.trim()}>
            {isLoading ? (
              <span className="h-4 w-4 border-2 border-t-transparent border-primary-foreground rounded-full animate-spin mr-2"></span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
