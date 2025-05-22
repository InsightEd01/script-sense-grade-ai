
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { Loading } from '@/components/ui/loading';

export default function ChatPage() {
  const [isChatRoomOpen, setIsChatRoomOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthProvider();
  
  // Fetch chat rooms
  const { 
    data: chatRooms = [],
    isLoading: isLoadingRooms,
    isError: isRoomsError
  } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          created_at,
          created_by,
          chat_participants:chat_participants(user_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load chat rooms",
          variant: "destructive"
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });
  
  // Create new chat room
  const createChatRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // 1. Create a new chat room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          created_by: user.id
        })
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // 2. Add the current user as a participant
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomData.id,
          user_id: user.id
        });
      
      if (participantError) throw participantError;
      
      return roomData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      setSelectedRoomId(data.id);
      setIsChatRoomOpen(true);
      toast({
        title: "Chat room created",
        description: `Created "${data.name}" chat room successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create chat room: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle creating a new chat room
  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Invalid name",
        description: "Please enter a valid room name",
        variant: "destructive"
      });
      return;
    }
    
    createChatRoomMutation.mutate(newRoomName.trim());
    setNewRoomName('');
    setIsDialogOpen(false);
  };
  
  // Handle selecting a chat room
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsChatRoomOpen(true);
  };
  
  // Close chat room on mobile
  const handleCloseRoom = () => {
    setIsChatRoomOpen(false);
  };

  // Effect to close room view on mobile when no room is selected
  useEffect(() => {
    if (!selectedRoomId) {
      setIsChatRoomOpen(false);
    }
  }, [selectedRoomId]);
  
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className={`w-full md:w-80 border-r ${isChatRoomOpen ? 'hidden md:block' : 'block'}`}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Chat</h2>
              <Button size="sm" variant="default" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoadingRooms ? (
                <div className="flex justify-center items-center h-32">
                  <Loading text="Loading chats..." />
                </div>
              ) : isRoomsError ? (
                <div className="p-4 text-center text-red-500">
                  Failed to load chat rooms
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="mb-4">No chat rooms available</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Create a new chat
                  </Button>
                </div>
              ) : (
                <ChatList
                  chatRooms={chatRooms}
                  selectedRoomId={selectedRoomId}
                  onRoomSelect={handleRoomSelect}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className={`flex-1 ${!isChatRoomOpen ? 'hidden md:block' : 'block'}`}>
          {selectedRoomId ? (
            <ChatRoom 
              roomId={selectedRoomId} 
              onBack={handleCloseRoom}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-6">
                <h3 className="text-xl font-semibold mb-2">No Chat Selected</h3>
                <p className="text-gray-500 mb-4">
                  Select a chat from the sidebar or create a new one to start messaging
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="mx-auto"
                >
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* New Chat Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Chat Room</DialogTitle>
            <DialogDescription>
              Enter a name for your new chat room
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Enter room name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateRoom();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoom}
              disabled={createChatRoomMutation.isPending}
            >
              {createChatRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
