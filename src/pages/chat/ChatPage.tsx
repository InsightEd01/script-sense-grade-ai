
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ChatPage = () => {
  const { roomId } = useParams();
  const { isTeacher } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect non-teachers away from new chat page
  useEffect(() => {
    if (roomId === 'new' && !isTeacher) {
      toast({
        title: "Permission Denied",
        description: "Only teachers can create new chat rooms",
        variant: "destructive"
      });
      navigate('/chat');
    }
  }, [roomId, isTeacher]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {roomId ? <ChatRoom /> : <ChatList />}
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
