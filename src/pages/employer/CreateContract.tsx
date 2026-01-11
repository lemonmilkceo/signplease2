import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { StepContainer, StepQuestion } from "@/components/ui/step-container";
import { AIGenerating } from "@/components/ui/loading";
import { ArrowLeft, Calendar, Clock, Wallet, Banknote, Info, Sparkles, Coffee, Building2, Users } from "lucide-react";
import { WORK_DAYS_PER_WEEK, MINIMUM_WAGE_2026, MINIMUM_WAGE_WITH_HOLIDAY_2026, JOB_KEYWORDS, WageType, BusinessSize } from "@/lib/contract-types";
import { Checkbox } from "@/components/ui/checkbox";
import { generateContractContent, createContract, ContractInput } from "@/lib/contract-api";
import { toast } from "sonner";
import { AllowanceCalculator } from "@/components/allowance-calculator";
import { parseWorkTime } from "@/lib/wage-utils";

const TOTAL_STEPS = 10;
const BREAK_TIME_OPTIONS = [0, 30, 60, 90, 120];

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

  // 5인 이상 사업장: Step 10 진입 시 포괄임금 수당 기본값 자동 계산
  useEffect(() => {
    if (currentStep === 10 && contractForm.businessSize === 'over5') {
      const hourlyWage = contractForm.hourlyWage || MINIMUM_WAGE_2026;
      const dailyWorkHours = parseWorkTime(
        contractForm.workStartTime || '09:00',
        contractForm.workEndTime || '18:00',
        contractForm.breakTimeMinutes || 0
      );
      
      // 기본값이 없을 때만 자동 계산 (단위당 금액)
      if (!contractForm.comprehensiveWageDetails?.overtimePerHour &&
          !contractForm.comprehensiveWageDetails?.holidayPerDay &&
          !contractForm.comprehensiveWageDetails?.annualLeavePerDay) {
        
        setContractForm({
          comprehensiveWageDetails: {
            overtimePerHour: Math.round(hourlyWage * 1.5),
            holidayPerDay: Math.round(hourlyWage * 1.5 * dailyWorkHours),
            annualLeavePerDay: Math.round(hourlyWage * dailyWorkHours),
          }
        });
      }
    }
  }, [currentStep, contractForm.businessSize]);

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
        return !!contractForm.businessSize; // 사업장 규모 선택 필수
      case 2:
        return (contractForm.workerName?.length || 0) >= 2;
      case 3:
        if (!contractForm.wageType) return false;
        if (contractForm.wageType === 'hourly') {
          const minWage = contractForm.includeWeeklyHolidayPay 
            ? MINIMUM_WAGE_WITH_HOLIDAY_2026 
            : MINIMUM_WAGE_2026;
          return (contractForm.hourlyWage || 0) >= minWage;
        } else {
          return (contractForm.monthlyWage || 0) > 0;
        }
      case 4:
        // 시작일 필수, 종료일은 noEndDate가 true이거나 endDate가 있으면 유효
        return !!contractForm.startDate && (contractForm.noEndDate || !!contractForm.endDate);
      case 5:
        return (contractForm.workDaysPerWeek || 0) >= 1;
      case 6:
        return !!contractForm.workStartTime && !!contractForm.workEndTime;
      case 7:
        return contractForm.breakTimeMinutes !== undefined; // 휴게시간 필수
      case 8:
        return (contractForm.workLocation?.length || 0) > 0;
      case 9:
        // 말일지급이거나 지급일이 선택되어야 유효
        const hasPaymentDay = (contractForm.paymentDay || 0) >= 1 && (contractForm.paymentDay || 0) <= 28;
        const isEndOfMonth = contractForm.paymentEndOfMonth === true;
        return (hasPaymentDay || isEndOfMonth) && !!contractForm.paymentMonth;
      case 10:
        // 5인 이상 사업장일 경우 포괄임금 수당 세부 내역 필수
        if (contractForm.businessSize === 'over5') {
          const details = contractForm.comprehensiveWageDetails;
          return !!(details?.overtimePerHour || details?.holidayPerDay || details?.annualLeavePerDay);
        }
        return true; // 5인 미만은 선택사항
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
          {/* Step 1: 사업장 규모 선택 */}
          {currentStep === 1 && (
            <StepContainer key="step-1" stepKey={1}>
              <StepQuestion
                question="사장님, 사업장 규모를 선택해주세요"
                description="상시 근로자 수에 따라 근로기준법 적용이 달라져요"
                className="mb-8"
              />
              <div className="space-y-4">
                <motion.button
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    contractForm.businessSize === 'under5'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setContractForm({ businessSize: 'under5' })}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    contractForm.businessSize === 'under5' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-body font-semibold ${
                      contractForm.businessSize === 'under5' ? 'text-primary' : 'text-foreground'
                    }`}>5인 미만 사업장</p>
                    <p className="text-caption text-muted-foreground">일부 근로기준법 적용 제외</p>
                  </div>
                </motion.button>
                
                <motion.button
                  className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    contractForm.businessSize === 'over5'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setContractForm({ businessSize: 'over5' })}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    contractForm.businessSize === 'over5' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-body font-semibold ${
                      contractForm.businessSize === 'over5' ? 'text-primary' : 'text-foreground'
                    }`}>5인 이상 사업장</p>
                    <p className="text-caption text-muted-foreground">근로기준법 전면 적용</p>
                  </div>
                </motion.button>

                {contractForm.businessSize === 'over5' && (
                  <motion.div
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-caption text-amber-700 dark:text-amber-300">
                      <Info className="w-4 h-4 inline mr-1" />
                      5인 이상 사업장은 포괄임금 계약 시 각 수당의 금액을 세부적으로 명시해야 법적 효력이 있어요.
                    </p>
                  </motion.div>
                )}
              </div>
            </StepContainer>
          )}

          {/* Step 2: 근로자 이름 */}
          {currentStep === 2 && (
            <StepContainer key="step-2" stepKey={2}>
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

          {/* Step 3: 급여 형태 */}
          {currentStep === 3 && (
            <StepContainer key="step-3" stepKey={3}>
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

          {/* Step 4: 근무 기간 */}
          {currentStep === 4 && (
            <StepContainer key="step-4" stepKey={4}>
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
                    계약종료일 없음
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

          {/* Step 5: 주 근무일수 */}
          {currentStep === 5 && (
            <StepContainer key="step-5" stepKey={5}>
              <StepQuestion question="주 몇 일 근무하나요?" className="mb-8" />
              <div className="grid grid-cols-4 gap-3">
                {WORK_DAYS_PER_WEEK.map((days) => (
                  <motion.button
                    key={days}
                    className={`h-14 rounded-2xl text-body font-semibold transition-all ${contractForm.workDaysPerWeek === days ? 'bg-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    onClick={() => setContractForm({ workDaysPerWeek: days })}
                    whileTap={{ scale: 0.95 }}
                  >주 {days}일</motion.button>
                ))}
              </div>
            </StepContainer>
          )}

          {/* Step 6: 근무 시간 */}
          {currentStep === 6 && (
            <StepContainer key="step-6" stepKey={6}>
              <StepQuestion question="근무 시간을 알려주세요" className="mb-8" />
              <div className="space-y-6">
                <div>
                  <p className="text-body font-medium text-foreground mb-3">출근 시간</p>
                  <div className="flex items-center gap-3">
                    <select className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer" value={contractForm.workStartTime?.split(':')[0] || '09'} onChange={(e) => { const minutes = contractForm.workStartTime?.split(':')[1] || '00'; setContractForm({ workStartTime: `${e.target.value}:${minutes}` }); }}>
                      {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}시</option>))}
                    </select>
                    <span className="text-muted-foreground text-xl">:</span>
                    <select className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer" value={contractForm.workStartTime?.split(':')[1] || '00'} onChange={(e) => { const hours = contractForm.workStartTime?.split(':')[0] || '09'; setContractForm({ workStartTime: `${hours}:${e.target.value}` }); }}>
                      {['00', '10', '20', '30', '40', '50'].map((min) => (<option key={min} value={min}>{min}분</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-body font-medium text-foreground mb-3">퇴근 시간</p>
                  <div className="flex items-center gap-3">
                    <select className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer" value={contractForm.workEndTime?.split(':')[0] || '18'} onChange={(e) => { const minutes = contractForm.workEndTime?.split(':')[1] || '00'; setContractForm({ workEndTime: `${e.target.value}:${minutes}` }); }}>
                      {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}시</option>))}
                    </select>
                    <span className="text-muted-foreground text-xl">:</span>
                    <select className="flex-1 h-14 px-4 rounded-2xl border-2 border-border bg-background text-body-lg font-semibold text-center focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer" value={contractForm.workEndTime?.split(':')[1] || '00'} onChange={(e) => { const hours = contractForm.workEndTime?.split(':')[0] || '18'; setContractForm({ workEndTime: `${hours}:${e.target.value}` }); }}>
                      {['00', '10', '20', '30', '40', '50'].map((min) => (<option key={min} value={min}>{min}분</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </StepContainer>
          )}

          {/* Step 7: 휴게시간 */}
          {currentStep === 7 && (
            <StepContainer key="step-7" stepKey={7}>
              <StepQuestion question="휴게시간을 알려주세요" description="4시간 근무 시 30분, 8시간 근무 시 1시간 이상 휴게시간이 필요해요" className="mb-8" />
              <div className="grid grid-cols-3 gap-3">
                {BREAK_TIME_OPTIONS.map((minutes) => (
                  <motion.button key={minutes} className={`h-16 rounded-2xl text-body font-semibold transition-all flex flex-col items-center justify-center gap-1 ${contractForm.breakTimeMinutes === minutes ? 'bg-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={() => setContractForm({ breakTimeMinutes: minutes })} whileTap={{ scale: 0.95 }}>
                    <Coffee className={`w-5 h-5 ${contractForm.breakTimeMinutes === minutes ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span>{minutes === 0 ? '없음' : `${minutes}분`}</span>
                  </motion.button>
                ))}
              </div>
            </StepContainer>
          )}

          {/* Step 8: 근무 장소 */}
          {currentStep === 8 && (
            <StepContainer key="step-8" stepKey={8}>
              <StepQuestion question="근무 장소는 어디인가요?" className="mb-8" />
              <Input variant="toss" inputSize="xl" placeholder="예: 서울시 강남구 테헤란로 123" value={contractForm.workLocation || ''} onChange={(e) => setContractForm({ workLocation: e.target.value })} autoFocus />
            </StepContainer>
          )}

          {/* Step 9: 임금 지급일 */}
          {currentStep === 9 && (
            <StepContainer key="step-9" stepKey={9}>
              <StepQuestion question="임금은 언제 지급하나요?" className="mb-8" />
              <div className="space-y-6">
                <div className="flex gap-3">
                  <motion.button className={`flex-1 h-14 rounded-2xl text-body font-semibold transition-all ${contractForm.paymentMonth === 'current' ? 'bg-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={() => setContractForm({ paymentMonth: 'current' })} whileTap={{ scale: 0.98 }}>당월 지급</motion.button>
                  <motion.button className={`flex-1 h-14 rounded-2xl text-body font-semibold transition-all ${contractForm.paymentMonth === 'next' ? 'bg-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={() => setContractForm({ paymentMonth: 'next' })} whileTap={{ scale: 0.98 }}>익월 지급</motion.button>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Checkbox id="paymentEndOfMonth" checked={contractForm.paymentEndOfMonth || false} onCheckedChange={(checked) => setContractForm({ paymentEndOfMonth: checked === true, paymentDay: checked === true ? undefined : contractForm.paymentDay })} />
                  <label htmlFor="paymentEndOfMonth" className="text-body font-medium text-foreground cursor-pointer">말일 지급</label>
                </div>
                {!contractForm.paymentEndOfMonth && (
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <motion.button key={day} className={`h-11 rounded-xl text-caption font-medium transition-all ${contractForm.paymentDay === day ? 'bg-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={() => setContractForm({ paymentDay: day })} whileTap={{ scale: 0.95 }}>{day}</motion.button>
                    ))}
                  </div>
                )}
              </div>
            </StepContainer>
          )}

          {/* Step 10: 업무 내용 및 수당 안내 */}
          {currentStep === 10 && (
            <StepContainer key="step-10" stepKey={10}>
              {/* 업무 내용 (공통) */}
              <StepQuestion question="주요 업무 내용을 알려주세요" description="선택사항이에요" className="mb-6" />
              <div className="flex flex-wrap gap-2 mb-6">
                {JOB_KEYWORDS.map((keyword) => {
                  const isSelected = contractForm.jobDescription?.includes(keyword);
                  return (
                    <motion.button key={keyword} className={`px-4 py-2 rounded-full text-caption font-medium transition-all ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} onClick={() => { const current = contractForm.jobDescription || ''; const updated = isSelected ? current.split(', ').filter(k => k !== keyword).join(', ') : current ? `${current}, ${keyword}` : keyword; setContractForm({ jobDescription: updated }); }} whileTap={{ scale: 0.95 }}>{keyword}</motion.button>
                  );
                })}
              </div>
              <textarea className="w-full h-24 p-4 rounded-2xl border-2 border-border bg-background text-body focus:border-primary focus:outline-none transition-colors resize-none" placeholder="추가로 입력하고 싶은 업무 내용을 적어주세요" value={contractForm.jobDescription || ''} onChange={(e) => setContractForm({ jobDescription: e.target.value })} />
              
              {/* 수당 안내 (5인 이상/미만 공통 - 자동 계산) */}
              {(() => {
                const hourlyWage = contractForm.hourlyWage || MINIMUM_WAGE_2026;
                const dailyWorkHours = parseWorkTime(
                  contractForm.workStartTime || '09:00',
                  contractForm.workEndTime || '18:00',
                  contractForm.breakTimeMinutes || 0
                );
                const DEFAULT_OVERTIME_HOURS = 10;
                const DEFAULT_HOLIDAY_DAYS = 1;
                const DEFAULT_ANNUAL_LEAVE_DAYS = 5;
                
                // 단위당 수당 계산
                const overtimePerHour = Math.round(hourlyWage * 1.5);
                const holidayPerDay = Math.round(hourlyWage * 1.5 * dailyWorkHours);
                const annualLeavePerDay = Math.round(hourlyWage * dailyWorkHours);
                
                // 예상 총액 계산
                const overtimeAllowance = overtimePerHour * DEFAULT_OVERTIME_HOURS;
                const holidayAllowance = holidayPerDay * DEFAULT_HOLIDAY_DAYS;
                const annualLeaveAllowance = annualLeavePerDay * DEFAULT_ANNUAL_LEAVE_DAYS;
                
                const isOver5 = contractForm.businessSize === 'over5';
                
                return (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-caption font-medium text-blue-700 dark:text-blue-300">
                          예상 수당 내역 {isOver5 ? '(5인 이상 사업장)' : '(5인 미만 사업장)'}
                        </p>
                      </div>
                      
                      {/* 단위당 수당 안내 */}
                      <div className="mb-4 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-blue-100 dark:border-blue-700">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">📌 단위당 추가 수당</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600/80 dark:text-blue-400/80">연장근로 1시간당</span>
                            <span className="font-semibold text-blue-700 dark:text-blue-300">+{overtimePerHour.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600/80 dark:text-blue-400/80">휴일근로 1일당</span>
                            <span className="font-semibold text-blue-700 dark:text-blue-300">+{holidayPerDay.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600/80 dark:text-blue-400/80">연차유급휴가 1일당</span>
                            <span className="font-semibold text-blue-700 dark:text-blue-300">+{annualLeavePerDay.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 예상 총액 */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">📊 월/연 예상 수당</p>
                        <div className="flex justify-between text-caption">
                          <span className="text-blue-600/80 dark:text-blue-400/80">연장근로수당 (월 {DEFAULT_OVERTIME_HOURS}시간 기준)</span>
                          <span className="font-medium text-blue-700 dark:text-blue-300">{overtimeAllowance.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-caption">
                          <span className="text-blue-600/80 dark:text-blue-400/80">휴일근로수당 (월 {DEFAULT_HOLIDAY_DAYS}일 기준)</span>
                          <span className="font-medium text-blue-700 dark:text-blue-300">{holidayAllowance.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-caption">
                          <span className="text-blue-600/80 dark:text-blue-400/80">연차유급휴가 수당 (연 {DEFAULT_ANNUAL_LEAVE_DAYS}일 기준)</span>
                          <span className="font-medium text-blue-700 dark:text-blue-300">{annualLeaveAllowance.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 5인 이상 사업장: 수당 직접 입력 */}
                    {isOver5 && (
                      <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                        <p className="text-caption font-medium text-violet-700 dark:text-violet-300 mb-3">
                          ✏️ 포괄임금 수당 명시 (필수)
                        </p>
                        <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mb-4">
                          단위별 금액을 명시하면 추가 근로 발생 시 계산이 편해요.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mb-1">연장근로수당 (1시간당)</p>
                            <div className="relative">
                              <Input variant="toss" inputSize="lg" type="number" placeholder={overtimePerHour.toString()} value={contractForm.comprehensiveWageDetails?.overtimePerHour || ''} onChange={(e) => setContractForm({ comprehensiveWageDetails: { ...contractForm.comprehensiveWageDetails, overtimePerHour: Number(e.target.value) || undefined } })} className="pr-12" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-body">원</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mb-1">휴일근로수당 (1일당)</p>
                            <div className="relative">
                              <Input variant="toss" inputSize="lg" type="number" placeholder={holidayPerDay.toString()} value={contractForm.comprehensiveWageDetails?.holidayPerDay || ''} onChange={(e) => setContractForm({ comprehensiveWageDetails: { ...contractForm.comprehensiveWageDetails, holidayPerDay: Number(e.target.value) || undefined } })} className="pr-12" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-body">원</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mb-1">연차유급휴가 수당 (1일당)</p>
                            <div className="relative">
                              <Input variant="toss" inputSize="lg" type="number" placeholder={annualLeavePerDay.toString()} value={contractForm.comprehensiveWageDetails?.annualLeavePerDay || ''} onChange={(e) => setContractForm({ comprehensiveWageDetails: { ...contractForm.comprehensiveWageDetails, annualLeavePerDay: Number(e.target.value) || undefined } })} className="pr-12" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-body">원</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-caption text-amber-700 dark:text-amber-300 font-medium mb-1">
                        ⚠️ 추가 수당 발생 가능
                      </p>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                        위 금액은 예상 기준이며, 실제 연장/휴일근로 시간이 증가하면 추가 수당을 지급해야 합니다.
                      </p>
                    </div>
                  </div>
                );
              })()} 
            </StepContainer>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button */}
      <div className="px-6 pb-8 pt-4">
        {currentStep === TOTAL_STEPS ? (
          <Button
            size="full"
            onClick={handleNext}
            disabled={!isStepValid()}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            AI로 계약서 생성하기
          </Button>
        ) : (
          <Button
            variant="toss"
            size="full"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
