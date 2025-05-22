import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { createChatRoom, getChatRooms } from '@/services/dataService';

export const ChatList = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isTeacher, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const fetchChatRooms = async () => {
      try {
        setIsLoading(true);
        const data = await getChatRooms();
        setChatRooms(data);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load chat rooms. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatRooms();
    
    // Set up realtime subscription for chat rooms
    const channel = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => {
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleNewChatClick = async () => {
    if (!(isTeacher || isAdmin)) {
      toast({
        title: "Permission Denied",
        description: "Only teachers and admins can create new chat rooms",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const roomName = `Chat Room ${new Date().toLocaleDateString()}`;
      if (!user?.id) throw new Error('User not authenticated');
      
      await createChatRoom(roomName, user.id);
      
      toast({
        title: "Success",
        description: "Chat room created successfully",
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: "Failed to create chat room. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Rooms</h2>
        <Button onClick={handleNewChatClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat Room
        </Button>
      </div>

      {chatRooms.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No chat rooms available. Create a new one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chatRooms.map((room) => (
            <Link key={room.id} to={`/chat/${room.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                  Created {new Date(room.created_at).toLocaleDateString()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
