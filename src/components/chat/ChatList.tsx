
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export const ChatList = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    const fetchChatRooms = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load chat rooms",
          variant: "destructive"
        });
        return;
      }

      setChatRooms(data);
    };

    fetchChatRooms();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_rooms' },
        fetchChatRooms
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Rooms</h2>
        <Link to="/chat/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Chat Room
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chatRooms.map((room) => (
          <Link key={room.id} to={`/chat/${room.id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
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
    </div>
  );
};
