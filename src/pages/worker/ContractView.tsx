import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "@/lib/store";
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
  Check,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ContractSlide {
  icon: React.ReactNode;
  title: string;
  value: string;
  description?: string;
  helpText?: string;
}

export default function WorkerContractView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contracts, updateContract } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [showHelp, setShowHelp] = useState<number | null>(null);
  const constraintsRef = useRef(null);

  const contract = contracts.find((c) => c.id === id);

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
      value: contract.employerName,
      description: "근로계약의 당사자입니다",
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "시급",
      value: `${contract.hourlyWage.toLocaleString()}원`,
      description: "2025년 최저시급은 10,030원입니다",
      helpText: "시급은 근로기준법에 따라 최저임금 이상이어야 합니다. 주휴수당, 연장근로수당 등은 별도로 계산됩니다.",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "근무 시작일",
      value: contract.startDate,
      helpText: "이 날짜부터 근로관계가 시작됩니다. 4대 보험 가입도 이 날부터 적용됩니다.",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "근무 시간",
      value: `${contract.workStartTime} - ${contract.workEndTime}`,
      description: `매주 ${contract.workDays.join(', ')}요일`,
      helpText: "1일 8시간, 주 40시간을 초과하는 근무는 연장근로수당(시급의 1.5배)이 지급됩니다.",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "근무 장소",
      value: contract.workLocation,
      helpText: "실제 근무하는 장소입니다. 사업장 변경 시 사전 협의가 필요합니다.",
    },
  ];

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (info.offset.x > threshold && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSign = (signatureData: string) => {
    updateContract(contract.id!, {
      workerSignature: signatureData,
      status: 'completed',
    });
    toast.success("계약이 완료되었습니다!");
    navigate('/worker');
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
            onClick={() => setCurrentSlide(index)}
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
              {/* Help Button */}
              {slides[currentSlide].helpText && (
                <button
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowHelp(showHelp === currentSlide ? null : currentSlide)}
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              )}

              {/* Help Tooltip */}
              <AnimatePresence>
                {showHelp === currentSlide && slides[currentSlide].helpText && (
                  <motion.div
                    className="absolute top-16 left-4 right-4 p-4 bg-accent rounded-2xl border border-primary/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-caption text-foreground">
                      {slides[currentSlide].helpText}
                    </p>
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
            onClick={() => setCurrentSlide(currentSlide - 1)}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentSlide === slides.length - 1
                ? 'opacity-0 pointer-events-none'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            onClick={() => setCurrentSlide(currentSlide + 1)}
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
              이 계약서는 {contract.createdAt}에 서명되었습니다
            </p>
          </motion.div>
        ) : (
          <Button
            variant="toss"
            size="full"
            onClick={() => setIsSignatureOpen(true)}
          >
            확인했으며, 서명합니다
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
