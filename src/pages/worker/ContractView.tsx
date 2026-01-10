import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getContract, signContractAsWorker, explainTerm, Contract } from "@/lib/contract-api";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Wallet,
  User,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ContractSlide {
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
  helpTerm?: string;
}

export default function WorkerContractView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [showHelp, setShowHelp] = useState<number | null>(null);
  const [helpExplanation, setHelpExplanation] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [signing, setSigning] = useState(false);
  const constraintsRef = useRef(null);

  useEffect(() => {
    async function fetchContract() {
      if (!id) return;
      try {
        const data = await getContract(id);
        setContract(data);
      } catch (error) {
        console.error('Error fetching contract:', error);
        toast.error('계약서를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchContract();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">계약서를 찾을 수 없습니다</p>
      </div>
    );
  }

  const slides: ContractSlide[] = [
    {
      icon: <User className="w-8 h-8" />,
      title: "사업주",
      value: contract.employer_name,
      description: "근로계약의 당사자입니다",
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "시급",
      value: `${contract.hourly_wage.toLocaleString()}원`,
      description: "2025년 최저시급은 10,030원입니다",
      helpTerm: "시급",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "근무 시작일",
      value: contract.start_date,
      helpTerm: "근무 시작일",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "근무 시간",
      value: `${contract.work_start_time} - ${contract.work_end_time}`,
      description: `매주 ${contract.work_days.join(', ')}`,
      helpTerm: "근무 시간",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "근무 장소",
      value: contract.work_location,
      helpTerm: "근무 장소",
    },
  ];

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setShowHelp(null);
      setHelpExplanation(null);
    } else if (info.offset.x > threshold && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setShowHelp(null);
      setHelpExplanation(null);
    }
  };

  const handleHelpClick = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide.helpTerm) return;

    if (showHelp === slideIndex) {
      setShowHelp(null);
      setHelpExplanation(null);
      return;
    }

    setShowHelp(slideIndex);
    setLoadingHelp(true);
    setHelpExplanation(null);

    try {
      const explanation = await explainTerm(slide.helpTerm, `근로계약서의 ${slide.title} 항목`);
      setHelpExplanation(explanation);
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast.error('설명을 불러오는데 실패했습니다');
      setShowHelp(null);
    } finally {
      setLoadingHelp(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!contract.id) return;
    
    setSigning(true);
    try {
      await signContractAsWorker(contract.id, signatureData);
      toast.success("계약이 완료되었습니다!");
      navigate('/worker');
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error('서명에 실패했습니다');
    } finally {
      setSigning(false);
      setIsSignatureOpen(false);
    }
  };

  const isCompleted = contract.status === 'completed';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/worker')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-heading font-semibold text-foreground">근로계약서</h1>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-2 py-4">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-6 bg-primary'
                : 'bg-muted-foreground/30'
            }`}
            onClick={() => {
              setCurrentSlide(index);
              setShowHelp(null);
              setHelpExplanation(null);
            }}
          />
        ))}
      </div>

      {/* Card Slider */}
      <div className="flex-1 px-6 py-4 overflow-hidden" ref={constraintsRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="h-full"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            <div className="bg-card rounded-3xl p-8 h-full flex flex-col items-center justify-center shadow-card border border-border/50 relative">
              {/* AI Help Button */}
              {slides[currentSlide].helpTerm && (
                <button
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    showHelp === currentSlide 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                  onClick={() => handleHelpClick(currentSlide)}
                >
                  {showHelp === currentSlide ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* AI Explanation Tooltip */}
              <AnimatePresence>
                {showHelp === currentSlide && (
                  <motion.div
                    className="absolute top-16 left-4 right-4 p-4 bg-gradient-to-br from-primary/10 to-accent rounded-2xl border border-primary/20"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {loadingHelp ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-caption text-muted-foreground">AI가 설명을 준비하고 있어요...</span>
                        </div>
                      ) : (
                        <p className="text-caption text-foreground leading-relaxed">
                          {helpExplanation}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                {slides[currentSlide].icon}
              </div>

              <p className="text-caption text-muted-foreground mb-2">
                {slides[currentSlide].title}
              </p>

              <h2 className="text-display text-foreground text-center mb-2">
                {slides[currentSlide].value}
              </h2>

              {slides[currentSlide].description && (
                <p className="text-body text-muted-foreground text-center">
                  {slides[currentSlide].description}
                </p>
              )}

              {/* AI Help hint */}
              {slides[currentSlide].helpTerm && !showHelp && (
                <motion.p 
                  className="absolute bottom-6 text-xs text-muted-foreground flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Sparkles className="w-3 h-3" />
                  터치하면 AI가 쉽게 설명해드려요
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="flex justify-between mt-4">
          <button
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentSlide === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            onClick={() => {
              setCurrentSlide(currentSlide - 1);
              setShowHelp(null);
              setHelpExplanation(null);
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentSlide === slides.length - 1
                ? 'opacity-0 pointer-events-none'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            onClick={() => {
              setCurrentSlide(currentSlide + 1);
              setShowHelp(null);
              setHelpExplanation(null);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-6 py-8">
        {isCompleted ? (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-body font-semibold">계약 완료</span>
            </div>
            <p className="text-caption text-muted-foreground text-center">
              이 계약서는 {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('ko-KR') : ''}에 서명되었습니다
            </p>
          </motion.div>
        ) : (
          <Button
            variant="toss"
            size="full"
            onClick={() => setIsSignatureOpen(true)}
            disabled={signing}
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                서명 중...
              </>
            ) : (
              '확인했으며, 서명합니다'
            )}
          </Button>
        )}
      </div>

      {/* Signature Canvas Modal */}
      <SignatureCanvas
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSave={handleSign}
      />
    </div>
  );
}
