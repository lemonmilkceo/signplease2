import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ChevronRight, ChevronLeft, Send, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const FAQ_ITEMS = [
  {
    question: "계약서는 어떻게 작성하나요?",
    answer: "대시보드에서 '새 계약서 작성하기' 버튼을 누르면 간단한 질문에 답하는 것만으로 표준근로계약서가 자동으로 생성됩니다. 근로자 이름, 시급, 근무시간 등을 입력하면 됩니다."
  },
  {
    question: "크레딧은 어떻게 충전하나요?",
    answer: "메뉴 > 크레딧 관리에서 원하는 패키지를 선택하여 충전할 수 있습니다. 첫 가입 시 5건의 무료 크레딧이 제공됩니다."
  },
  {
    question: "근로자에게 계약서는 어떻게 전달하나요?",
    answer: "계약서 작성 후 '공유하기' 버튼을 통해 카카오톡이나 링크로 근로자에게 전달할 수 있습니다. 근로자는 링크를 통해 계약서를 확인하고 서명할 수 있습니다."
  },
  {
    question: "전자서명은 법적 효력이 있나요?",
    answer: "네, 전자서명법에 따라 전자서명은 법적 효력을 가집니다. 서명된 계약서는 PDF로 다운로드하여 보관하실 수 있습니다."
  },
  {
    question: "5인 미만과 5인 이상 사업장의 차이는?",
    answer: "5인 이상 사업장은 근로기준법이 전면 적용되어 연장근로수당, 휴일수당, 연차휴가 등이 의무입니다. 5인 미만은 일부 규정이 적용되지 않습니다."
  },
  {
    question: "결제 취소 및 환불은 어떻게 하나요?",
    answer: "사용하지 않은 크레딧에 대해서는 결제 후 7일 이내 전액 환불이 가능합니다. 고객센터로 문의해 주세요."
  },
];

export function SupportChat() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'home' | 'faq' | 'chat' | 'faq-detail'>('home');
  const [selectedFaq, setSelectedFaq] = useState<typeof FAQ_ITEMS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 싸인해주세요 고객센터입니다. 무엇을 도와드릴까요?'
    }
  ]);

  // 온보딩/역할선택 화면에서는 숨김
  const hiddenPaths = ['/', '/select-role'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('support-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || '죄송합니다. 잠시 후 다시 시도해 주세요.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaqClick = (faq: typeof FAQ_ITEMS[0]) => {
    setSelectedFaq(faq);
    setView('faq-detail');
  };

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-5 bg-primary text-primary-foreground rounded-t-2xl">
              <h2 className="text-lg font-bold">고객센터</h2>
              <p className="text-sm opacity-90">무엇을 도와드릴까요?</p>
            </div>

            {/* Options */}
            <div className="flex-1 p-4 space-y-3">
              <motion.button
                onClick={() => setView('faq')}
                className="w-full p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex items-center gap-4 text-left"
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">자주 묻는 질문</p>
                  <p className="text-sm text-muted-foreground">FAQ에서 답변을 찾아보세요</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>

              <motion.button
                onClick={() => setView('chat')}
                className="w-full p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex items-center gap-4 text-left"
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">1:1 문의하기</p>
                  <p className="text-sm text-muted-foreground">상담원과 채팅으로 문의하세요</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                운영시간: 평일 10:00 - 18:00
              </p>
            </div>
          </motion.div>
        );

      case 'faq':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button
                onClick={() => setView('home')}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-foreground">자주 묻는 질문</h2>
            </div>

            {/* FAQ List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {FAQ_ITEMS.map((faq, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleFaqClick(faq)}
                    className="w-full p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <p className="font-medium text-foreground text-sm">
                      {faq.question}
                    </p>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        );

      case 'faq-detail':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button
                onClick={() => setView('faq')}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-foreground text-sm line-clamp-1">FAQ</h2>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-5">
                <h3 className="font-semibold text-foreground mb-4">
                  {selectedFaq?.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedFaq?.answer}
                </p>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={() => setView('chat')}
                variant="outline"
                className="w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                추가 문의하기
              </Button>
            </div>
          </motion.div>
        );

      case 'chat':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button
                onClick={() => setView('home')}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">1:1 문의</h2>
                <p className="text-xs text-muted-foreground">보통 몇 분 내 답변</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  variant="toss"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-colors
          ${isOpen 
            ? 'bg-muted text-muted-foreground' 
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-24 right-4 z-50 w-[340px] h-[500px] bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
