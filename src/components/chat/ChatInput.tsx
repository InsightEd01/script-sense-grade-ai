
import { useState } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChatInputProps {
  roomId: string | undefined;
}

export function ChatInput({ roomId }: ChatInputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !roomId || roomId === 'new') return;

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

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
      const fileName = `${Math.random()}.${fileExt}`;
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

  return (
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
  );
}
