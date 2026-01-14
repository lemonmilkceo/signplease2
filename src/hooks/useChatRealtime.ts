import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  is_read: boolean;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
}

type MessagePayload = RealtimePostgresChangesPayload<ChatMessage>;

interface UseChatRealtimeOptions {
  userId: string | undefined;
  onNewMessage?: (message: ChatMessage) => void;
  onMessageRead?: (message: ChatMessage) => void;
}

export function useChatRealtime({ userId, onNewMessage, onMessageRead }: UseChatRealtimeOptions) {
  const handleMessageChange = useCallback((payload: MessagePayload) => {
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new as ChatMessage;
      // Only notify if the message is from someone else
      if (newMessage.sender_id !== userId) {
        onNewMessage?.(newMessage);
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedMessage = payload.new as ChatMessage;
      // Check if message was marked as read
      if (updatedMessage.is_read) {
        onMessageRead?.(updatedMessage);
      }
    }
  }, [userId, onNewMessage, onMessageRead]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`chat-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        handleMessageChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, handleMessageChange]);
}
