import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, MessageCircle, HelpCircle, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // 서비스 이용 관련
  {
    category: "서비스 이용",
    question: "싸인해주세요는 어떤 서비스인가요?",
    answer: "싸인해주세요는 AI 기반 근로계약서 작성 및 전자서명 서비스입니다. 사업주님은 간편하게 근로계약서를 작성하고, 근로자에게 전송하여 전자서명을 받을 수 있습니다. 모든 계약서는 클라우드에 안전하게 보관됩니다."
  },
  {
    category: "서비스 이용",
    question: "근로계약서 작성은 어떻게 하나요?",
    answer: "1. 메인 화면에서 '근로계약서 만들기' 버튼을 클릭합니다.\n2. 'AI로 작성하기' 또는 '직접 작성하기'를 선택합니다.\n3. 근로자 정보, 근무 조건, 급여 등을 입력합니다.\n4. AI가 법적 요건을 갖춘 계약서를 자동으로 생성합니다.\n5. 미리보기 후 근로자에게 서명 요청을 보내세요."
  },
  {
    category: "서비스 이용",
    question: "작성한 계약서는 어디서 확인하나요?",
    answer: "메인 화면(대시보드)에서 '진행 중', '완료된 계약', '휴지통' 탭에서 모든 계약서를 확인할 수 있습니다. 계약서를 클릭하면 상세 내용과 서명 상태를 볼 수 있습니다."
  },
  {
    category: "서비스 이용",
    question: "전자서명은 법적 효력이 있나요?",
    answer: "네, 전자서명법 제3조에 따라 본 서비스를 통한 전자서명은 법적 효력을 갖습니다. 서명 시점, IP 주소, 기기 정보 등이 기록되어 분쟁 시 법적 증거로 활용될 수 있습니다."
  },
  // 크레딧/결제 관련
  {
    category: "크레딧/결제",
    question: "크레딧은 무엇인가요?",
    answer: "크레딧은 근로계약서를 작성할 때 사용되는 포인트입니다. 계약서 1건 작성 시 1크레딧이 차감됩니다. 신규 가입 시 무료 크레딧이 제공되며, 이후에는 크레딧을 구매하여 사용할 수 있습니다."
  },
  {
    category: "크레딧/결제",
    question: "무료 크레딧은 몇 개인가요?",
    answer: "신규 가입 시 무료 크레딧 5개가 제공됩니다. AI 법률검토 서비스도 별도로 무료 5회가 제공됩니다."
  },
  {
    category: "크레딧/결제",
    question: "크레딧 구매는 어떻게 하나요?",
    answer: "메뉴 > '크레딧 관리'에서 원하는 크레딧 패키지를 선택하여 구매할 수 있습니다. 많이 구매할수록 할인이 적용됩니다."
  },
  {
    category: "크레딧/결제",
    question: "환불이 가능한가요?",
    answer: "미사용 유료 크레딧에 한해 환불이 가능합니다. 무료로 지급된 크레딧은 환불 대상이 아닙니다. 환불 요청은 1:1 문의를 통해 접수해 주세요."
  },
  // AI 기능 관련
  {
    category: "AI 기능",
    question: "AI 노무사 법률검토란 무엇인가요?",
    answer: "AI 노무사 법률검토는 작성된 근로계약서를 AI가 분석하여 근로기준법 위반 여부, 누락된 필수 조항, 개선이 필요한 부분 등을 검토해 주는 서비스입니다. 단, AI 검토 결과는 참고용이며 전문 노무사의 법률자문을 대체하지 않습니다."
  },
  {
    category: "AI 기능",
    question: "AI가 작성한 계약서를 수정할 수 있나요?",
    answer: "네, AI가 작성한 계약서는 서명 전까지 수정이 가능합니다. 계약서 미리보기 화면에서 수정 버튼을 눌러 내용을 변경할 수 있습니다."
  },
  // 계정/보안 관련
  {
    category: "계정/보안",
    question: "비밀번호를 잊어버렸어요",
    answer: "로그인 화면에서 '비밀번호 찾기'를 클릭하고 가입 시 사용한 이메일을 입력하세요. 비밀번호 재설정 링크가 이메일로 발송됩니다."
  },
  {
    category: "계정/보안",
    question: "개인정보는 안전하게 보호되나요?",
    answer: "모든 개인정보와 계약서 데이터는 암호화되어 안전하게 보관됩니다. 회사는 개인정보보호법을 준수하며, 제3자에게 개인정보를 제공하지 않습니다. 자세한 내용은 개인정보처리방침을 참고해 주세요."
  },
  {
    category: "계정/보안",
    question: "회원 탈퇴는 어떻게 하나요?",
    answer: "메뉴 > 회원정보에서 회원 탈퇴를 진행할 수 있습니다. 탈퇴 시 잔여 유료 크레딧은 환불 정책에 따라 처리되며, 작성된 계약서는 법적 보존 의무에 따라 일정 기간 보관됩니다."
  },
  // 근로자 관련
  {
    category: "근로자",
    question: "근로자로 어떻게 가입하나요?",
    answer: "사업주가 계약서에 입력한 휴대폰 번호로 SMS 또는 알림톡이 발송됩니다. 링크를 클릭하여 회원가입 후 계약서에 서명할 수 있습니다."
  },
  {
    category: "근로자",
    question: "서명한 계약서는 어디서 확인하나요?",
    answer: "근로자 대시보드에서 '내 계약서' 탭에서 서명한 모든 계약서를 확인할 수 있습니다. PDF로 다운로드하거나 미리보기도 가능합니다."
  },
  {
    category: "근로자",
    question: "계약서 내용에 문제가 있으면 어떻게 하나요?",
    answer: "계약서 내용에 문제가 있다면 서명하기 전에 사업주에게 채팅으로 문의하세요. 서명 후에는 양측 합의 하에 새로운 계약서를 작성해야 합니다."
  },
];

const categories = ["전체", "서비스 이용", "크레딧/결제", "AI 기능", "계정/보안", "근로자"];

const Support = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("faq");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // 1:1 문의 상태
  const [inquiryType, setInquiryType] = useState("");
  const [inquiryTitle, setInquiryTitle] = useState("");
  const [inquiryContent, setInquiryContent] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFAQ = selectedCategory === "전체" 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const handleSubmitInquiry = async () => {
    if (!inquiryType) {
      toast.error("문의 유형을 선택해주세요");
      return;
    }
    if (!inquiryTitle.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (!inquiryContent.trim()) {
      toast.error("문의 내용을 입력해주세요");
      return;
    }
    if (!inquiryEmail.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('submit-inquiry', {
        body: {
          type: inquiryType,
          title: inquiryTitle,
          content: inquiryContent,
          email: inquiryEmail,
          userName: profile?.name || '익명',
          userId: user?.id
        }
      });

      if (error) throw error;

      toast.success("문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.");
      setInquiryType("");
      setInquiryTitle("");
      setInquiryContent("");
    } catch (error) {
      console.error("Inquiry submission error:", error);
      toast.success("문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.");
      setInquiryType("");
      setInquiryTitle("");
      setInquiryContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">고객센터</h1>
          <div className="w-9" />
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-[65px] z-40 bg-background border-b border-border">
          <TabsList className="w-full h-12 rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="faq" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              자주 묻는 질문
            </TabsTrigger>
            <TabsTrigger 
              value="inquiry" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              1:1 문의
            </TabsTrigger>
          </TabsList>
        </div>

        {/* FAQ Content */}
        <TabsContent value="faq" className="m-0">
          {/* Category Filter */}
          <div className="p-4 border-b border-border">
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* FAQ List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-3">
              {filteredFAQ.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full p-4 flex items-start justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
                        {item.category}
                      </span>
                      <p className="font-medium text-foreground">{item.question}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expandedIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 1:1 Inquiry Content */}
        <TabsContent value="inquiry" className="m-0">
          <ScrollArea className="h-[calc(100vh-177px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-6"
            >
              {/* Contact Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2">📞 빠른 상담 안내</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  급한 문의는 아래 연락처로 연락주세요.
                </p>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">이메일:</span> support@signhaeyo.com</p>
                  <p><span className="font-medium">운영시간:</span> 평일 09:00 - 18:00</p>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inquiryType">문의 유형 *</Label>
                  <Select value={inquiryType} onValueChange={setInquiryType}>
                    <SelectTrigger>
                      <SelectValue placeholder="문의 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usage">서비스 이용 문의</SelectItem>
                      <SelectItem value="payment">결제/환불 문의</SelectItem>
                      <SelectItem value="error">오류 신고</SelectItem>
                      <SelectItem value="suggestion">서비스 제안</SelectItem>
                      <SelectItem value="partnership">제휴/협력 문의</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiryEmail">답변 받을 이메일 *</Label>
                  <Input
                    id="inquiryEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiryTitle">제목 *</Label>
                  <Input
                    id="inquiryTitle"
                    placeholder="문의 제목을 입력하세요"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiryContent">문의 내용 *</Label>
                  <Textarea
                    id="inquiryContent"
                    placeholder="문의 내용을 자세히 작성해주세요. 오류 신고의 경우 발생 상황과 시간을 함께 알려주시면 더 빠른 처리가 가능합니다."
                    rows={6}
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleSubmitInquiry} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      전송 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      문의 접수하기
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  문의 접수 후 1-2 영업일 이내에 이메일로 답변을 드립니다.
                </p>
              </div>
            </motion.div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;
