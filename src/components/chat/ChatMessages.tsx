
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center text-muted-foreground p-8">
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground p-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => (
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
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
