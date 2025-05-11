
-- Add RLS policies for chat_rooms
ALTER TABLE IF EXISTS public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Allow users to select chat rooms they participate in
CREATE POLICY "Users can view chat rooms they participate in" ON public.chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = id
        AND chat_participants.user_id = auth.uid()
    )
  );

-- Allow users to create new chat rooms
CREATE POLICY "Users can create new chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Allow owners to update their own chat rooms
CREATE POLICY "Room creators can update their own chat rooms" ON public.chat_rooms
  FOR UPDATE USING (created_by = auth.uid());

-- Allow owners to delete their own chat rooms
CREATE POLICY "Room creators can delete their own chat rooms" ON public.chat_rooms
  FOR DELETE USING (created_by = auth.uid());

-- Add RLS policies for chat_participants
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Allow users to see all participants in rooms they are part of
CREATE POLICY "Users can see participants in rooms they belong to" ON public.chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants AS cp
      WHERE cp.room_id = room_id
        AND cp.user_id = auth.uid()
    )
  );

-- Allow users to add themselves to chat rooms
CREATE POLICY "Users can add themselves to chat rooms" ON public.chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow room creators to add any users to their rooms
CREATE POLICY "Room creators can add users to their rooms" ON public.chat_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = room_id
        AND chat_rooms.created_by = auth.uid()
    )
  );

-- Allow users to remove themselves from chat rooms
CREATE POLICY "Users can remove themselves from chat rooms" ON public.chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for chat_messages
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to see messages in rooms they participate in
CREATE POLICY "Users can view messages in rooms they participate in" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = room_id
        AND chat_participants.user_id = auth.uid()
    )
  );

-- Allow users to send messages to rooms they participate in
CREATE POLICY "Users can send messages to rooms they participate in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.room_id = room_id
        AND chat_participants.user_id = auth.uid()
    )
  );

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.chat_messages
  FOR DELETE USING (sender_id = auth.uid());

-- Add a helper function to check if user is a participant in a room
CREATE OR REPLACE FUNCTION public.is_room_participant(room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = $1 AND user_id = auth.uid()
  );
$$;
