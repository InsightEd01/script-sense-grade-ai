
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { supabase } from '@/lib/supabase';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatRoomProps {
  roomId: string;
  onBack: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  message_text: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  sent_at: string;
  sender_email?: string;
  sender_name?: string;
}

export function ChatRoom({ roomId, onBack }: ChatRoomProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuthProvider();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch room details
  const { data: roomDetails, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['chatRoom', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          created_at,
          created_by
        `)
        .eq('id', roomId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!roomId
  });
  
  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message_text,
          attachment_url,
          attachment_type,
          sent_at
        `)
        .eq('room_id', roomId)
        .order('sent_at', { ascending: true });
        
      if (error) throw error;
      
      // Fetch sender details
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', senderIds);
        
      const senderMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      return (data || []).map(msg => ({
        ...msg,
        sender_email: senderMap[msg.sender_id]?.email || 'Unknown User'
      }));
    },
    enabled: !!roomId,
    refetchInterval: 5000 // Poll for new messages every 5 seconds
  });
  
  // Realtime subscription for new messages
  useEffect(() => {
    if (!roomId) return;
    
    // Set up subscription
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        }, 
        (payload) => {
          // Invalidate query to refetch messages
          queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] });
        }
      )
      .subscribe();
    
    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, attachmentUrl, attachmentType }: {
      text?: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
      if (!user || !roomId) throw new Error("Cannot send message");
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          message_text: text || null,
          attachment_url: attachmentUrl || null,
          attachment_type: attachmentType || null
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Optimistic update would be better but for simplicity we'll invalidate the query
      queryClient.invalidateQueries({ queryKey: ['chatMessages', roomId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Upload file function
  const uploadFile = async (file: File) => {
    if (!user) return null;
    
    setIsUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);
        
      return {
        url: urlData.publicUrl,
        type: file.type
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle message send
  const handleSendMessage = async () => {
    if ((!message.trim() && !file) || sendMessageMutation.isPending || isUploading) return;
    
    let attachmentUrl = null;
    let attachmentType = null;
    
    if (file) {
      const result = await uploadFile(file);
      if (result) {
        attachmentUrl = result.url;
        attachmentType = result.type;
      }
      setFile(null);
    }
    
    if (message.trim() || attachmentUrl) {
      await sendMessageMutation.mutateAsync({
        text: message.trim() || undefined,
        attachmentUrl,
        attachmentType
      });
      setMessage('');
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Show initials for avatar
  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .substring(0, 2)
      .toUpperCase();
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  if (isLoadingRoom || isLoadingMessages) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading text="Loading chat room..." />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2" 
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-medium">{roomDetails?.name || 'Chat Room'}</h2>
          <p className="text-sm text-gray-500">
            Created {roomDetails?.created_at ? format(new Date(roomDetails.created_at), 'MMM d, yyyy') : ''}
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender_id === user?.id;
            return (
              <div 
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback>
                      {getInitials(msg.sender_email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    {!isCurrentUser && (
                      <div className="text-xs text-gray-500 mb-1">
                        {msg.sender_email?.split('@')[0]}
                      </div>
                    )}
                    
                    <div className={`${
                      isCurrentUser 
                        ? 'bg-blue-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                        : 'bg-gray-200 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                    } p-3`}>
                      {msg.message_text && <p>{msg.message_text}</p>}
                      
                      {msg.attachment_url && (
                        <div className="mt-2">
                          {msg.attachment_type?.startsWith('image/') ? (
                            <img 
                              src={msg.attachment_url} 
                              alt="Attachment" 
                              className="max-w-full rounded max-h-64 object-contain"
                            />
                          ) : (
                            <a 
                              href={msg.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center p-2 bg-white/20 rounded"
                            >
                              <Paperclip className="h-4 w-4 mr-2" />
                              <span className="truncate">
                                {msg.attachment_url.split('/').pop()}
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
                      {format(new Date(msg.sent_at), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* File preview */}
      {file && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessageMutation.isPending || isUploading}
          >
            <Paperclip className="h-5 w-5" />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={sendMessageMutation.isPending || isUploading}
            />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending || isUploading}
            onKeyDown={handleKeyPress}
          />
          
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={(!message.trim() && !file) || sendMessageMutation.isPending || isUploading}
            variant="default"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
