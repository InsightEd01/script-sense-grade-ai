
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export const ChatList = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isTeacher } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const fetchChatRooms = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setChatRooms(data);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load chat rooms",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatRooms();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => fetchChatRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNewChatClick = () => {
    if (!isTeacher) {
      toast({
        title: "Permission Denied",
        description: "Only teachers can create new chat rooms",
        variant: "destructive"
      });
      return;
    }
    navigate('/chat/new');
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
