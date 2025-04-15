
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';

const ChatPage = () => {
  const { roomId } = useParams();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {roomId ? <ChatRoom /> : <ChatList />}
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
