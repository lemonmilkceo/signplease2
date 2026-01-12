-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employer_id, worker_id)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view their chat rooms"
ON public.chat_rooms
FOR SELECT
USING (auth.uid() = employer_id OR auth.uid() = worker_id);

CREATE POLICY "Employers can create chat rooms"
ON public.chat_rooms
FOR INSERT
WITH CHECK (auth.uid() = employer_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (chat_rooms.employer_id = auth.uid() OR chat_rooms.worker_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their rooms"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (chat_rooms.employer_id = auth.uid() OR chat_rooms.worker_id = auth.uid())
  )
);

CREATE POLICY "Users can update read status"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND (chat_rooms.employer_id = auth.uid() OR chat_rooms.worker_id = auth.uid())
  )
);

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', true, 10485760);

-- Storage policies
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Add updated_at trigger
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();