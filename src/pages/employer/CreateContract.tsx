import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { StepContainer, StepQuestion } from "@/components/ui/step-container";
import { AIGenerating } from "@/components/ui/loading";
import { ArrowLeft, Calendar, Clock, Wallet, Banknote, Info } from "lucide-react";
import { WORK_DAYS_PER_WEEK, MINIMUM_WAGE_2026, MINIMUM_WAGE_WITH_HOLIDAY_2026, WageType } from "@/lib/contract-types";
import { Checkbox } from "@/components/ui/checkbox";
import { generateContractContent, createContract, ContractInput } from "@/lib/contract-api";
import { toast } from "sonner";

const TOTAL_STEPS = 8;

export default function CreateContract() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isDemo, contractForm, setContractForm, addContract } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !isDemo) {
      navigate('/');
    }
  }, [user, isDemo, authLoading, navigate]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerateContract();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/employer');
    }
  };

  const handleGenerateContract = async () => {
    setIsGenerating(true);

    const contractData: ContractInput = {
      employerName: profile?.name || '사장님',
      workerName: contractForm.workerName || '',
      hourlyWage: contractForm.hourlyWage || MINIMUM_WAGE_2026,
      startDate: contractForm.startDate || new Date().toISOString().split('T')[0],
      workDays: contractForm.workDays || [],
      workStartTime: contractForm.workStartTime || '09:00',
      workEndTime: contractForm.workEndTime || '18:00',
      workLocation: contractForm.workLocation || '',
      jobDescription: contractForm.jobDescription,
    };

    try {
      if (isDemo) {
        // Demo mode - simulate AI generation
        await new Promise((resolve) => setTimeout(resolve, 2500));
        
        const mockContract = {
          id: Date.now().toString(),
          ...contractData,
          wageType: contractForm.wageType || 'hourly',
          monthlyWage: contractForm.monthlyWage,
          status: 'draft' as const,
          createdAt: new Date().toISOString().split('T')[0],
        };

        addContract(mockContract);
        navigate(`/employer/preview/${mockContract.id}`);
      } else if (user) {
        // Real mode - use AI and database
        const contractContent = await generateContractContent(contractData);
        const newContract = await createContract(contractData, contractContent, user.id);
        navigate(`/employer/preview/${newContract.id}`);
      }
    } catch (error) {
      console.error("Contract generation error:", error);
      toast.error("계약서 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (contractForm.workerName?.length || 0) >= 2;
      case 2:
        if (!contractForm.wageType) return false;
        if (contractForm.wageType === 'hourly') {
          const minWage = contractForm.includeWeeklyHolidayPay 
            ? MINIMUM_WAGE_WITH_HOLIDAY_2026 
            : MINIMUM_WAGE_2026;
          return (contractForm.hourlyWage || 0) >= minWage;
        } else {
          return (contractForm.monthlyWage || 0) > 0;
        }
      case 3:
        // 시작일 필수, 종료일은 noEndDate가 true이거나 endDate가 있으면 유효
        return !!contractForm.startDate && (contractForm.noEndDate || !!contractForm.endDate);
      case 4:
        return (contractForm.workDaysPerWeek || 0) >= 1;
      case 5:
        return !!contractForm.workStartTime && !!contractForm.workEndTime;
      case 6:
        return (contractForm.workLocation?.length || 0) > 0;
      case 7:
        // 말일지급이거나 지급일이 선택되어야 유효
        const hasPaymentDay = (contractForm.paymentDay || 0) >= 1 && (contractForm.paymentDay || 0) <= 28;
        const isEndOfMonth = contractForm.paymentEndOfMonth === true;
        return (hasPaymentDay || isEndOfMonth) && !!contractForm.paymentMonth;
      case 8:
        return true; // 업무내용은 선택사항
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
                question="급여 형태를 선택해주세요"
                className="mb-8"
              />
              
              {/* Wage Type Selection */}
              <div className="flex gap-3 mb-6">
                <motion.button
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    contractForm.wageType === 'hourly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setContractForm({ wageType: 'hourly', monthlyWage: undefined })}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    contractForm.wageType === 'hourly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className={`text-body font-semibold ${
                    contractForm.wageType === 'hourly' ? 'text-primary' : 'text-muted-foreground'
                  }`}>시급</span>
                </motion.button>
                
                <motion.button
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    contractForm.wageType === 'monthly'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setContractForm({ wageType: 'monthly', hourlyWage: 0 })}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    contractForm.wageType === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Banknote className="w-6 h-6" />
                  </div>
                  <span className={`text-body font-semibold ${
                    contractForm.wageType === 'monthly' ? 'text-primary' : 'text-muted-foreground'
                  }`}>월급</span>
                </motion.button>
              </div>

              {/* Wage Input */}
              {contractForm.wageType && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {contractForm.wageType === 'hourly' ? (
                    <>
                      <p className="text-caption text-muted-foreground mb-2">
                        2026년 최저시급은 {MINIMUM_WAGE_2026.toLocaleString()}원이에요
                      </p>
                      <div className="relative">
                        <Input
                          variant="toss"
                          inputSize="xl"
                          type="number"
                          placeholder={MINIMUM_WAGE_2026.toString()}
                          value={contractForm.hourlyWage || ''}
                          onChange={(e) => setContractForm({ hourlyWage: Number(e.target.value) })}
                          className="pr-12"
                          autoFocus
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-body-lg">
                          원
                        </span>
                      </div>
                      
                      {/* 주휴수당 포함 체크박스 */}
                      <div className="mt-4 flex items-start gap-3">
                        <Checkbox
                          id="weeklyHolidayPay"
                          checked={contractForm.includeWeeklyHolidayPay || false}
                          onCheckedChange={(checked) => 
                            setContractForm({ includeWeeklyHolidayPay: checked === true })
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor="weeklyHolidayPay" 
                            className="text-body font-medium text-foreground cursor-pointer"
                          >
                            주휴수당 포함
                          </label>
                          {contractForm.includeWeeklyHolidayPay && (
                            <motion.p
                              className="mt-1 text-caption text-primary flex items-center gap-1"
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <Info className="w-3.5 h-3.5" />
                              주휴수당 포함 시 최저시급은 {MINIMUM_WAGE_WITH_HOLIDAY_2026.toLocaleString()}원이에요
                            </motion.p>
                          )}
                        </div>
                      </div>
                      
                      {/* 최저시급 미만 경고 */}
                      {(contractForm.hourlyWage || 0) > 0 && (
                        contractForm.includeWeeklyHolidayPay 
                          ? contractForm.hourlyWage! < MINIMUM_WAGE_WITH_HOLIDAY_2026 
                          : contractForm.hourlyWage! < MINIMUM_WAGE_2026
                      ) && (
                        <motion.p
                          className="mt-3 text-caption text-destructive"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {contractForm.includeWeeklyHolidayPay 
                            ? `주휴수당 포함 시 최저시급(${MINIMUM_WAGE_WITH_HOLIDAY_2026.toLocaleString()}원) 이상으로 설정해주세요`
                            : '최저시급 이상으로 설정해주세요'}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-caption text-muted-foreground mb-2">
                        월 급여를 입력해주세요
                      </p>
                      <div className="relative">
                        <Input
                          variant="toss"
                          inputSize="xl"
                          type="number"
                          placeholder="2500000"
                          value={contractForm.monthlyWage || ''}
                          onChange={(e) => setContractForm({ monthlyWage: Number(e.target.value) })}
                          className="pr-12"
                          autoFocus
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-body-lg">
                          원
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </StepContainer>
          )}

          {currentStep === 3 && (
            <StepContainer key="step-3" stepKey={3}>
              <StepQuestion
                question="근무 기간을 알려주세요"
                className="mb-8"
              />
              <div className="space-y-4">
                <div>
                  <p className="text-caption text-muted-foreground mb-2">근무 시작일</p>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      variant="toss"
                      inputSize="lg"
                      type="date"
                      value={contractForm.startDate || ''}
                      onChange={(e) => setContractForm({ startDate: e.target.value })}
                      className="pl-14"
                      max="9999-12-31"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* 계약종료일 없음 체크박스 */}
                <div className="flex items-center gap-3 py-2">
                  <Checkbox
                    id="noEndDate"
                    checked={contractForm.noEndDate || false}
                    onCheckedChange={(checked) => 
                      setContractForm({ 
                        noEndDate: checked === true,
                        endDate: checked === true ? undefined : contractForm.endDate 
                      })
                    }
                  />
                  <label 
                    htmlFor="noEndDate" 
                    className="text-body font-medium text-foreground cursor-pointer"
                  >
                    계약종료일 없음 (무기계약)
                  </label>
                </div>
                
                {/* 계약종료일 입력 */}
                {!contractForm.noEndDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-caption text-muted-foreground mb-2">계약 종료일</p>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        variant="toss"
                        inputSize="lg"
                        type="date"
                        value={contractForm.endDate || ''}
                        onChange={(e) => setContractForm({ endDate: e.target.value })}
                        className="pl-14"
                        min={contractForm.startDate}
                        max="9999-12-31"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </StepContainer>
          )}

          {currentStep === 4 && (
            <StepContainer key="step-4" stepKey={4}>
              <StepQuestion
                question="주 몇 일 근무하나요?"
                className="mb-8"
              />
              <div className="grid grid-cols-4 gap-3">
                {WORK_DAYS_PER_WEEK.map((days) => (
                  <motion.button
                    key={days}
                    className={`h-14 rounded-2xl text-body font-semibold transition-all ${
                      contractForm.workDaysPerWeek === days
                        ? 'bg-primary text-primary-foreground shadow-button'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => setContractForm({ workDaysPerWeek: days })}
                    whileTap={{ scale: 0.95 }}
                  >
                    주 {days}일
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
              <div className="space-y-6">
                {/* 시작 시간 */}
                <div>
                  <p className="text-body font-medium text-foreground mb-3">출근 시간</p>
                  <div className="flex items-center gap-3">
                    <select
                      className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                      value={contractForm.workStartTime?.split(':')[0] || '09'}
                      onChange={(e) => {
                        const minutes = contractForm.workStartTime?.split(':')[1] || '00';
                        setContractForm({ workStartTime: `${e.target.value}:${minutes}` });
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}시
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground text-xl">:</span>
                    <select
                      className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                      value={contractForm.workStartTime?.split(':')[1] || '00'}
                      onChange={(e) => {
                        const hours = contractForm.workStartTime?.split(':')[0] || '09';
                        setContractForm({ workStartTime: `${hours}:${e.target.value}` });
                      }}
                    >
                      {['00', '30'].map((min) => (
                        <option key={min} value={min}>
                          {min}분
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 종료 시간 */}
                <div>
                  <p className="text-body font-medium text-foreground mb-3">퇴근 시간</p>
                  <div className="flex items-center gap-3">
                    <select
                      className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                      value={contractForm.workEndTime?.split(':')[0] || '18'}
                      onChange={(e) => {
                        const minutes = contractForm.workEndTime?.split(':')[1] || '00';
                        setContractForm({ workEndTime: `${e.target.value}:${minutes}` });
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}시
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground text-xl">:</span>
                    <select
                      className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                      value={contractForm.workEndTime?.split(':')[1] || '00'}
                      onChange={(e) => {
                        const hours = contractForm.workEndTime?.split(':')[0] || '18';
                        setContractForm({ workEndTime: `${hours}:${e.target.value}` });
                      }}
                    >
                      {['00', '30'].map((min) => (
                        <option key={min} value={min}>
                          {min}분
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 근무 시간 요약 */}
                {contractForm.workStartTime && contractForm.workEndTime && (
                  <motion.div
                    className="p-4 rounded-2xl bg-primary/5 border border-primary/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-body text-primary font-medium text-center">
                      {contractForm.workStartTime} ~ {contractForm.workEndTime} 근무
                    </p>
                  </motion.div>
                )}
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

          {currentStep === 7 && (
            <StepContainer key="step-7" stepKey={7}>
              <StepQuestion
                question="임금은 언제 지급하나요?"
                className="mb-8"
              />
              <div className="space-y-6">
                {/* 당월/익월 선택 */}
                <div>
                  <p className="text-body font-medium text-foreground mb-3">지급 기준</p>
                  <div className="flex gap-3">
                    <motion.button
                      className={`flex-1 h-14 rounded-2xl text-body font-semibold transition-all ${
                        contractForm.paymentMonth === 'current'
                          ? 'bg-primary text-primary-foreground shadow-button'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => setContractForm({ paymentMonth: 'current' })}
                      whileTap={{ scale: 0.98 }}
                    >
                      당월 지급
                    </motion.button>
                    <motion.button
                      className={`flex-1 h-14 rounded-2xl text-body font-semibold transition-all ${
                        contractForm.paymentMonth === 'next'
                          ? 'bg-primary text-primary-foreground shadow-button'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => setContractForm({ paymentMonth: 'next' })}
                      whileTap={{ scale: 0.98 }}
                    >
                      익월 지급
                    </motion.button>
                  </div>
                </div>

                {/* 말일지급 체크박스 */}
                <div className="flex items-center gap-3 py-2">
                  <Checkbox
                    id="paymentEndOfMonth"
                    checked={contractForm.paymentEndOfMonth || false}
                    onCheckedChange={(checked) => 
                      setContractForm({ 
                        paymentEndOfMonth: checked === true,
                        paymentDay: checked === true ? undefined : contractForm.paymentDay 
                      })
                    }
                  />
                  <label 
                    htmlFor="paymentEndOfMonth" 
                    className="text-body font-medium text-foreground cursor-pointer"
                  >
                    말일 지급
                  </label>
                </div>

                {/* 지급일 선택 (말일 지급이 아닐 때만) */}
                {!contractForm.paymentEndOfMonth && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-body font-medium text-foreground mb-3">지급일</p>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <motion.button
                          key={day}
                          className={`h-11 rounded-xl text-caption font-medium transition-all ${
                            contractForm.paymentDay === day
                              ? 'bg-primary text-primary-foreground shadow-button'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          onClick={() => setContractForm({ paymentDay: day })}
                          whileTap={{ scale: 0.95 }}
                        >
                          {day}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 지급일 요약 */}
                {contractForm.paymentMonth && (contractForm.paymentEndOfMonth || contractForm.paymentDay) && (
                  <motion.div
                    className="p-4 rounded-2xl bg-primary/5 border border-primary/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-body text-primary font-medium text-center">
                      {contractForm.paymentMonth === 'current' ? '당월' : '익월'}{' '}
                      {contractForm.paymentEndOfMonth ? '말일' : `${contractForm.paymentDay}일`} 지급
                    </p>
                  </motion.div>
                )}
              </div>
            </StepContainer>
          )}

          {currentStep === 8 && (
            <StepContainer key="step-8" stepKey={8}>
              <StepQuestion
                question="주요 업무 내용을 알려주세요"
                description="선택사항이에요"
                className="mb-8"
              />
              <textarea
                className="w-full h-40 p-4 rounded-2xl border-2 border-border bg-background text-body focus:border-primary focus:outline-none transition-colors resize-none"
                placeholder="예: 홀 서빙, 주문 접수, 매장 청소 등"
                value={contractForm.jobDescription || ''}
                onChange={(e) => setContractForm({ jobDescription: e.target.value })}
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
