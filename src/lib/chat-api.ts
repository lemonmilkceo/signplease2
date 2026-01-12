import { supabase } from "@/integrations/supabase/client";

export interface ChatRoom {
  id: string;
  employer_id: string;
  worker_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  worker_profile?: {
    name: string | null;
    email: string | null;
  };
  employer_profile?: {
    name: string | null;
    email: string | null;
  };
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  is_read: boolean;
}

// Get or create a chat room between employer and worker
export async function getOrCreateChatRoom(
  employerId: string,
  workerId: string
): Promise<ChatRoom> {
  // Try to find existing room
  const { data: existing, error: findError } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("employer_id", employerId)
    .eq("worker_id", workerId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing as ChatRoom;

  // Create new room
  const { data: newRoom, error: createError } = await supabase
    .from("chat_rooms")
    .insert({ employer_id: employerId, worker_id: workerId })
    .select()
    .single();

  if (createError) throw createError;
  return newRoom as ChatRoom;
}

// Get all chat rooms for a user
export async function getChatRooms(userId: string): Promise<ChatRoom[]> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .or(`employer_id.eq.${userId},worker_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ChatRoom[];
}

// Get chat rooms with profiles (for employer view)
export async function getEmployerChatRooms(employerId: string): Promise<ChatRoom[]> {
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("employer_id", employerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Fetch worker profiles
  const workerIds = (rooms || []).map((r: any) => r.worker_id);
  if (workerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, email")
    .in("user_id", workerIds);

  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.user_id, { name: p.name, email: p.email }])
  );

  // Fetch last messages
  const roomIds = (rooms || []).map((r: any) => r.id);
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .in("room_id", roomIds)
    .order("created_at", { ascending: false });

  const lastMessageMap = new Map<string, ChatMessage>();
  const unreadCountMap = new Map<string, number>();
  
  (messages || []).forEach((m: any) => {
    if (!lastMessageMap.has(m.room_id)) {
      lastMessageMap.set(m.room_id, m as ChatMessage);
    }
    if (!m.is_read && m.sender_id !== employerId) {
      unreadCountMap.set(m.room_id, (unreadCountMap.get(m.room_id) || 0) + 1);
    }
  });

  return (rooms || []).map((r: any) => ({
    ...r,
    worker_profile: profileMap.get(r.worker_id) || null,
    last_message: lastMessageMap.get(r.id) || null,
    unread_count: unreadCountMap.get(r.id) || 0,
  })) as ChatRoom[];
}

// Get chat rooms with profiles (for worker view)
export async function getWorkerChatRooms(workerId: string): Promise<ChatRoom[]> {
  const { data: rooms, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("worker_id", workerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  // Fetch employer profiles
  const employerIds = (rooms || []).map((r: any) => r.employer_id);
  if (employerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, email")
    .in("user_id", employerIds);

  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.user_id, { name: p.name, email: p.email }])
  );

  // Fetch last messages
  const roomIds = (rooms || []).map((r: any) => r.id);
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .in("room_id", roomIds)
    .order("created_at", { ascending: false });

  const lastMessageMap = new Map<string, ChatMessage>();
  const unreadCountMap = new Map<string, number>();
  
  (messages || []).forEach((m: any) => {
    if (!lastMessageMap.has(m.room_id)) {
      lastMessageMap.set(m.room_id, m as ChatMessage);
    }
    if (!m.is_read && m.sender_id !== workerId) {
      unreadCountMap.set(m.room_id, (unreadCountMap.get(m.room_id) || 0) + 1);
    }
  });

  return (rooms || []).map((r: any) => ({
    ...r,
    employer_profile: profileMap.get(r.employer_id) || null,
    last_message: lastMessageMap.get(r.id) || null,
    unread_count: unreadCountMap.get(r.id) || 0,
  })) as ChatRoom[];
}

// Get messages for a room
export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ChatMessage[];
}

// Send a message
export async function sendMessage(
  roomId: string,
  senderId: string,
  content?: string,
  fileUrl?: string,
  fileName?: string,
  fileType?: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content: content || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_type: fileType || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Update room's updated_at
  await supabase
    .from("chat_rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", roomId);

  return data as ChatMessage;
}

// Mark messages as read
export async function markMessagesAsRead(
  roomId: string,
  readerId: string
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("room_id", roomId)
    .neq("sender_id", readerId)
    .eq("is_read", false);

  if (error) throw error;
}

// Upload file for chat
export async function uploadChatFile(
  file: File
): Promise<{ url: string; name: string; type: string }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("chat-attachments")
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    name: file.name,
    type: file.type,
  };
}

// Get workers who have contracts with employer (for starting new chats)
export async function getEmployerWorkers(employerId: string): Promise<Array<{ id: string; name: string; email: string | null }>> {
  const { data: contracts, error } = await supabase
    .from("contracts")
    .select("worker_id, worker_name")
    .eq("employer_id", employerId)
    .not("worker_id", "is", null);

  if (error) throw error;

  // Get unique worker IDs
  const workerMap = new Map<string, string>();
  (contracts || []).forEach((c: any) => {
    if (c.worker_id) {
      workerMap.set(c.worker_id, c.worker_name);
    }
  });

  // Fetch profiles
  const workerIds = Array.from(workerMap.keys());
  if (workerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, name, email")
    .in("user_id", workerIds);

  return workerIds.map(id => ({
    id,
    name: (profiles || []).find((p: any) => p.user_id === id)?.name || workerMap.get(id) || "근로자",
    email: (profiles || []).find((p: any) => p.user_id === id)?.email || null,
  }));
}
