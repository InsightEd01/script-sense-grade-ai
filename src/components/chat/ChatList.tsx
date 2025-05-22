
import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  chat_participants: { user_id: string }[];
}

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

export function ChatList({ chatRooms, selectedRoomId, onRoomSelect }: ChatListProps) {
  return (
    <div className="divide-y">
      {chatRooms.map((room) => (
        <div 
          key={room.id}
          className={cn(
            "p-4 cursor-pointer hover:bg-gray-100 transition-colors",
            selectedRoomId === room.id ? "bg-gray-100" : ""
          )}
          onClick={() => onRoomSelect(room.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{room.name}</h3>
              <p className="text-sm text-gray-500">
                {room.chat_participants.length} participants
              </p>
            </div>
            <span className="text-xs text-gray-500">
              {format(new Date(room.created_at), 'MMM d')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
