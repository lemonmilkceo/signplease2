import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatRoomList } from "@/components/chat/ChatRoomList";
import { ChatView } from "@/components/chat/ChatView";
import { ChatRoom } from "@/lib/chat-api";
import { AppDrawer } from "@/components/AppDrawer";

export default function WorkerChat() {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);

  if (selectedRoom) {
    return (
      <div className="min-h-screen bg-background">
        <ChatView
          room={selectedRoom}
          userType="worker"
          onBack={() => setSelectedRoom(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/worker")} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-title font-semibold">메시지</h1>
          </div>
          <AppDrawer userType="worker" />
        </div>
      </div>

      {/* Chat Room List */}
      <div className="px-6 pb-8">
        <ChatRoomList
          userType="worker"
          onSelectRoom={setSelectedRoom}
        />
      </div>
    </div>
  );
}
