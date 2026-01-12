import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight, Plus, User, Image, FileText } from "lucide-react";
import { CardSlide } from "@/components/ui/card-slide";
import { LoadingSpinner } from "@/components/ui/loading";
import { 
  ChatRoom, 
  getEmployerChatRooms, 
  getWorkerChatRooms,
  getEmployerWorkers,
  getOrCreateChatRoom 
} from "@/lib/chat-api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ChatRoomListProps {
  userType: "employer" | "worker";
  onSelectRoom: (room: ChatRoom) => void;
}

export function ChatRoomList({ userType, onSelectRoom }: ChatRoomListProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [workers, setWorkers] = useState<Array<{ id: string; name: string; email: string | null }>>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      try {
        const data = userType === "employer"
          ? await getEmployerChatRooms(user.id)
          : await getWorkerChatRooms(user.id);
        setRooms(data);
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
        toast.error("채팅 목록을 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [user, userType]);

  const handleNewChat = async () => {
    if (!user || userType !== "employer") return;
    
    setLoadingWorkers(true);
    try {
      const workerList = await getEmployerWorkers(user.id);
      setWorkers(workerList);
      setShowNewChatDialog(true);
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("근로자 목록을 불러오는데 실패했습니다");
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleSelectWorker = async (workerId: string) => {
    if (!user) return;

    try {
      const room = await getOrCreateChatRoom(user.id, workerId);
      const workerData = workers.find(w => w.id === workerId);
      
      // Enhance room with worker profile for immediate use
      const enhancedRoom: ChatRoom = {
        ...room,
        worker_profile: {
          name: workerData?.name || null,
          email: workerData?.email || null,
        },
      };

      setShowNewChatDialog(false);
      onSelectRoom(enhancedRoom);
    } catch (error) {
      console.error("Error creating chat room:", error);
      toast.error("채팅방 생성에 실패했습니다");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "a h:mm", { locale: ko });
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return format(date, "EEEE", { locale: ko });
    } else {
      return format(date, "M/d", { locale: ko });
    }
  };

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.last_message) return "새로운 대화를 시작하세요";
    
    if (room.last_message.file_url) {
      const isImage = room.last_message.file_type?.startsWith("image/");
      return isImage ? "📷 사진" : "📎 파일";
    }
    
    return room.last_message.content || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner text="채팅 목록 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Chat Button (Employer Only) */}
      {userType === "employer" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CardSlide
            onClick={handleNewChat}
            className="p-4 border-dashed"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">새 대화 시작하기</p>
                <p className="text-sm text-muted-foreground">
                  근로자에게 임금명세서나 메시지를 보내세요
                </p>
              </div>
            </div>
          </CardSlide>
        </motion.div>
      )}

      {/* Room List */}
      {rooms.length > 0 ? (
        <div className="space-y-2">
          {rooms.map((room, index) => {
            const name = userType === "employer" 
              ? room.worker_profile?.name || "근로자"
              : room.employer_profile?.name || "사업주";

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <CardSlide
                  onClick={() => onSelectRoom(room)}
                  className="p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      {room.unread_count && room.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {room.unread_count > 9 ? "9+" : room.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`font-semibold truncate ${room.unread_count ? "text-foreground" : "text-foreground"}`}>
                          {name}
                        </p>
                        {room.last_message && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(room.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${room.unread_count ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {getLastMessagePreview(room)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardSlide>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {userType === "employer" 
              ? "아직 대화가 없어요\n새 대화를 시작해보세요!"
              : "아직 받은 메시지가 없어요"}
          </p>
        </motion.div>
      )}

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>대화할 근로자 선택</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {workers.length > 0 ? (
              workers.map((worker) => (
                <CardSlide
                  key={worker.id}
                  onClick={() => handleSelectWorker(worker.id)}
                  className="p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{worker.name}</p>
                      {worker.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {worker.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardSlide>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  계약이 완료된 근로자가 없습니다
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
