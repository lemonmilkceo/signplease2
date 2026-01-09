import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { StepContainer, StepQuestion } from "@/components/ui/step-container";
import { AIGenerating } from "@/components/ui/loading";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { WORK_DAYS, MINIMUM_WAGE_2025, ContractData } from "@/lib/contract-types";

const TOTAL_STEPS = 6;

export default function CreateContract() {
  const navigate = useNavigate();
  const { contractForm, setContractForm, addContract, user } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      generateContract();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/employer');
    }
  };

  const generateContract = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    const newContract: ContractData = {
      id: Date.now().toString(),
      employerName: user?.name || '사장님',
      workerName: contractForm.workerName || '',
      hourlyWage: contractForm.hourlyWage || MINIMUM_WAGE_2025,
      startDate: contractForm.startDate || new Date().toISOString().split('T')[0],
      workDays: contractForm.workDays || [],
      workStartTime: contractForm.workStartTime || '09:00',
      workEndTime: contractForm.workEndTime || '18:00',
      workLocation: contractForm.workLocation || '',
      jobDescription: contractForm.jobDescription || '',
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addContract(newContract);
    setIsGenerating(false);
    navigate(`/employer/preview/${newContract.id}`);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (contractForm.workerName?.length || 0) >= 2;
      case 2:
        return (contractForm.hourlyWage || 0) >= MINIMUM_WAGE_2025;
      case 3:
        return !!contractForm.startDate;
      case 4:
        return (contractForm.workDays?.length || 0) > 0;
      case 5:
        return !!contractForm.workStartTime && !!contractForm.workEndTime;
      case 6:
        return (contractForm.workLocation?.length || 0) > 0;
      default:
        return false;
    }
  };

  const toggleWorkDay = (day: string) => {
    const currentDays = contractForm.workDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setContractForm({ workDays: newDays });
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <AIGenerating />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <ProgressSteps currentStep={currentStep} totalSteps={TOTAL_STEPS} className="flex-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <StepContainer key="step-1" stepKey={1}>
              <StepQuestion
                question="사장님, 근로자의 성함은 무엇인가요?"
                className="mb-8"
              />
              <Input
                variant="toss"
                inputSize="xl"
                placeholder="이름 입력"
                value={contractForm.workerName || ''}
                onChange={(e) => setContractForm({ workerName: e.target.value })}
                autoFocus
              />
            </StepContainer>
          )}

          {currentStep === 2 && (
            <StepContainer key="step-2" stepKey={2}>
              <StepQuestion
                question="시급은 얼마로 정하셨나요?"
                description={`2025년 최저시급은 ${MINIMUM_WAGE_2025.toLocaleString()}원이에요`}
                className="mb-8"
              />
              <div className="relative">
                <Input
                  variant="toss"
                  inputSize="xl"
                  type="number"
                  placeholder={MINIMUM_WAGE_2025.toString()}
                  value={contractForm.hourlyWage || ''}
                  onChange={(e) => setContractForm({ hourlyWage: Number(e.target.value) })}
                  className="pr-12"
                  autoFocus
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-body-lg">
                  원
                </span>
              </div>
              {(contractForm.hourlyWage || 0) > 0 && contractForm.hourlyWage! < MINIMUM_WAGE_2025 && (
                <motion.p
                  className="mt-3 text-caption text-destructive"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  최저시급 이상으로 설정해주세요
                </motion.p>
              )}
            </StepContainer>
          )}

          {currentStep === 3 && (
            <StepContainer key="step-3" stepKey={3}>
              <StepQuestion
                question="근무 시작일은 언제인가요?"
                className="mb-8"
              />
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  variant="toss"
                  inputSize="xl"
                  type="date"
                  value={contractForm.startDate || ''}
                  onChange={(e) => setContractForm({ startDate: e.target.value })}
                  className="pl-14"
                  autoFocus
                />
              </div>
            </StepContainer>
          )}

          {currentStep === 4 && (
            <StepContainer key="step-4" stepKey={4}>
              <StepQuestion
                question="어떤 요일에 근무하나요?"
                description="여러 개 선택할 수 있어요"
                className="mb-8"
              />
              <div className="flex flex-wrap gap-3">
                {WORK_DAYS.map((day) => (
                  <motion.button
                    key={day}
                    className={`w-14 h-14 rounded-2xl text-body font-semibold transition-all ${
                      contractForm.workDays?.includes(day)
                        ? 'bg-primary text-primary-foreground shadow-button'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => toggleWorkDay(day)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {day}
                  </motion.button>
                ))}
              </div>
            </StepContainer>
          )}

          {currentStep === 5 && (
            <StepContainer key="step-5" stepKey={5}>
              <StepQuestion
                question="근무 시간을 알려주세요"
                className="mb-8"
              />
              <div className="space-y-4">
                <div>
                  <p className="text-caption text-muted-foreground mb-2">시작 시간</p>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      variant="toss"
                      inputSize="lg"
                      type="time"
                      value={contractForm.workStartTime || ''}
                      onChange={(e) => setContractForm({ workStartTime: e.target.value })}
                      className="pl-14"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground mb-2">종료 시간</p>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      variant="toss"
                      inputSize="lg"
                      type="time"
                      value={contractForm.workEndTime || ''}
                      onChange={(e) => setContractForm({ workEndTime: e.target.value })}
                      className="pl-14"
                    />
                  </div>
                </div>
              </div>
            </StepContainer>
          )}

          {currentStep === 6 && (
            <StepContainer key="step-6" stepKey={6}>
              <StepQuestion
                question="근무 장소는 어디인가요?"
                className="mb-8"
              />
              <Input
                variant="toss"
                inputSize="xl"
                placeholder="예: 서울시 강남구 테헤란로 123"
                value={contractForm.workLocation || ''}
                onChange={(e) => setContractForm({ workLocation: e.target.value })}
                autoFocus
              />
            </StepContainer>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="px-6 pb-8 pt-4">
        <Button
          variant="toss"
          size="full"
          onClick={handleNext}
          disabled={!isStepValid()}
        >
          {currentStep === TOTAL_STEPS ? 'AI로 계약서 생성하기' : '다음'}
        </Button>
      </div>
    </div>
  );
}
