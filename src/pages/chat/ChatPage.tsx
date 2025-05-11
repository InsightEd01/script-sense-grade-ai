
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Plus } from 'lucide-react';

const ChatPage = () => {
  const { roomId } = useParams();
  const { isTeacher, isAdmin, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect non-teachers away from new chat page
  useEffect(() => {
    if (!isLoading && roomId === 'new' && !(isTeacher || isAdmin)) {
      toast({
        title: "Permission Denied",
        description: "Only teachers and admins can create new chat rooms",
        variant: "destructive"
      });
      navigate('/chat');
    }
  }, [roomId, isTeacher, isAdmin, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access chat features</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/signin')}>Sign In</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!roomId) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Chat Rooms</h1>
            {(isTeacher || isAdmin) && (
              <Button onClick={() => navigate('/chat/new')} className="bg-scriptsense-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Chat Room
              </Button>
            )}
          </div>
          <ChatList />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <ChatRoom />
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
