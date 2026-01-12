import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Send, Paperclip, Image as ImageIcon, 
  FileText, X, Loader2, Download, User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChatRoom, 
  ChatMessage, 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  uploadChatFile 
} from "@/lib/chat-api";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

interface ChatViewProps {
  room: ChatRoom;
  userType: "employer" | "worker";
  onBack: () => void;
}

export function ChatView({ room, userType, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partnerName = userType === "employer"
    ? room.worker_profile?.name || "근로자"
    : room.employer_profile?.name || "사업주";

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const data = await getChatMessages(room.id);
        setMessages(data);
        
        // Mark as read
        await markMessagesAsRead(room.id, user.id);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("메시지를 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if from partner
          if (newMessage.sender_id !== user.id) {
            await markMessagesAsRead(room.id, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || (!inputText.trim() && !previewFile)) return;

    setSending(true);
    try {
      await sendMessage(
        room.id,
        user.id,
        inputText.trim() || undefined,
        previewFile?.url,
        previewFile?.name,
        previewFile?.type
      );
      setInputText("");
      setPreviewFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("메시지 전송에 실패했습니다");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("이미지 또는 PDF 파일만 업로드 가능합니다");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadChatFile(file);
      setPreviewFile(uploaded);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("파일 업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatMessageDate = (dateStr: string) => {
    return format(new Date(dateStr), "M월 d일 (EEEE)", { locale: ko });
  };

  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), "a h:mm", { locale: ko });
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = formatMessageDate(message.created_at);
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: currentDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const renderMessage = (message: ChatMessage) => {
    const isMe = message.sender_id === user?.id;
    const isImage = message.file_type?.startsWith("image/");
    const isPdf = message.file_type === "application/pdf";

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}
      >
        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
          {!isMe && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-1">
            {/* File/Image */}
            {message.file_url && (
              <div 
                className={`rounded-2xl overflow-hidden ${
                  isMe ? "bg-primary" : "bg-muted"
                }`}
              >
                {isImage ? (
                  <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={message.file_url} 
                      alt={message.file_name || "이미지"} 
                      className="max-w-full max-h-64 object-cover"
                    />
                  </a>
                ) : isPdf ? (
                  <a 
                    href={message.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-3 ${
                      isMe ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    <FileText className="w-8 h-8 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.file_name || "파일"}
                      </p>
                      <p className={`text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        PDF 문서
                      </p>
                    </div>
                    <Download className="w-5 h-5 flex-shrink-0" />
                  </a>
                ) : null}
              </div>
            )}
            
            {/* Text */}
            {message.content && (
              <div 
                className={`px-4 py-2 rounded-2xl ${
                  isMe 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            )}
          </div>
          <span className={`text-xs text-muted-foreground flex-shrink-0 ${isMe ? "text-right" : ""}`}>
            {formatMessageTime(message.created_at)}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{partnerName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                첫 메시지를 보내보세요!<br />
                임금명세서나 파일도 보낼 수 있어요
              </p>
            </div>
          </div>
        ) : (
          <>
            {groupMessagesByDate(messages).map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {group.date}
                  </span>
                </div>
                {group.messages.map(renderMessage)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* File Preview */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 border-t border-border bg-muted/50"
          >
            <div className="flex items-center gap-2">
              {previewFile.type.startsWith("image/") ? (
                <img 
                  src={previewFile.url} 
                  alt={previewFile.name} 
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{previewFile.name}</p>
                <p className="text-xs text-muted-foreground">전송 준비 완료</p>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={sending || (!inputText.trim() && !previewFile)}
            size="icon"
            className="flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
