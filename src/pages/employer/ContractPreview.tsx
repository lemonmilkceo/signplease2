import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Wallet,
  User,
  Share2,
  Check,
  FileText,
  Briefcase,
  CreditCard,
  Sparkles,
  Scale,
  X,
  Loader2,
  Coffee,
  FileCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Zap,
  Edit,
  Download,
  MessageCircle,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { getContract, signContractAsEmployer, Contract } from "@/lib/contract-api";
import { getOrCreateChatRoom } from "@/lib/chat-api";
import { supabase } from "@/integrations/supabase/client";
import { parseWorkTime, calculateMonthlyWageBreakdown, calculateWeeklyHolidayPay } from "@/lib/wage-utils";
import { generateContractPDF, ContractPDFData } from "@/lib/pdf-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareContractModal } from "@/components/ShareContractModal";
import { WorkerReviewModal } from "@/components/WorkerReviewModal";
import { PDFPreviewModal } from "@/components/PDFPreviewModal";
import { getReviewByContract, WorkerReview, RATING_LABELS, RATING_COLORS } from "@/lib/review-api";
import { isContractEditable, getRemainingEditDays, CONTRACT_EDIT_PERIOD_DAYS } from "@/lib/contract-utils";

export default function ContractPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { isDemo, contracts: demoContracts, updateContract: updateDemoContract, contractForm } = useAppStore();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isLegalAdviceOpen, setIsLegalAdviceOpen] = useState(false);
  const [legalAdvice, setLegalAdvice] = useState<{
    grade: '완벽' | '양호' | '나쁨';
    summary: string;
    issues: string[];
    advice: string;
  } | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<WorkerReview | null>(null);
  const [remainingReviews, setRemainingReviews] = useState<number>(5);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      if (isDemo) {
        // Demo mode - use local state
        const demoContract = demoContracts.find((c) => c.id === id);
        if (demoContract) {
          setContract({
            id: demoContract.id!,
            employer_id: 'demo',
            worker_id: null,
            employer_name: demoContract.employerName,
            worker_name: demoContract.workerName,
            hourly_wage: demoContract.hourlyWage,
            start_date: demoContract.startDate,
            work_days: demoContract.workDays,
            work_start_time: demoContract.workStartTime,
            work_end_time: demoContract.workEndTime,
            work_location: demoContract.workLocation,
            business_name: demoContract.businessName || null,
            job_description: demoContract.jobDescription || null,
            status: demoContract.status,
            employer_signature: demoContract.employerSignature || null,
            worker_signature: demoContract.workerSignature || null,
            contract_content: null,
            created_at: demoContract.createdAt!,
            updated_at: demoContract.createdAt!,
            signed_at: null,
            folder_id: null,
          });
          setIsSigned(!!demoContract.employerSignature);
        }
        setIsLoading(false);
      } else if (id) {
        // Real mode - fetch from database
        try {
          const data = await getContract(id);
          setContract(data);
          setIsSigned(!!data?.employer_signature);
        } catch (error) {
          console.error("Error fetching contract:", error);
          toast.error("계약서를 불러오는데 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchContract();
  }, [id, isDemo, demoContracts]);

  // Fetch existing review for this contract
  useEffect(() => {
    const fetchReview = async () => {
      if (!id || isDemo) return;
      try {
        const review = await getReviewByContract(id);
        setExistingReview(review);
      } catch (error) {
        console.error("Error fetching review:", error);
      }
    };
    fetchReview();
  }, [id, isDemo]);

  // 남은 노무사 검토 횟수 조회
  useEffect(() => {
    const fetchRemainingReviews = async () => {
      if (!user || isDemo) {
        setIsLoadingReviews(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('get_remaining_legal_reviews', {
          p_user_id: user.id
        });
        
        if (error) throw error;
        setRemainingReviews(data ?? 5);
      } catch (error) {
        console.error("Error fetching remaining reviews:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchRemainingReviews();
  }, [user, isDemo]);

  const handleSign = async (signatureData: string) => {
    if (!contract) return;

    try {
      if (isDemo) {
        updateDemoContract(contract.id, { employerSignature: signatureData, status: 'pending' });
      } else {
        await signContractAsEmployer(contract.id, signatureData);
        setContract((prev) => prev ? { ...prev, employer_signature: signatureData, status: 'pending' } : null);
      }
      setIsSigned(true);
      toast.success("서명이 완료되었습니다!");
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("서명에 실패했습니다.");
    }
  };

  const handleShare = () => {
    if (!contract) return;
    setIsShareModalOpen(true);
  };

  const handleGetLegalAdvice = async () => {
    if (legalAdvice) {
      setIsLegalAdviceOpen(true);
      return;
    }

    // 크레딧 확인
    if (remainingReviews <= 0) {
      toast.error("무료 검토 횟수를 모두 사용했습니다. 추가 결제가 필요합니다.");
      navigate('/pricing');
      return;
    }

    setIsLegalAdviceOpen(true);
    setIsLoadingAdvice(true);

    try {
      // 크레딧 차감
      if (user && !isDemo) {
        const { data: creditUsed, error: creditError } = await supabase.rpc('use_legal_review', {
          p_user_id: user.id
        });
        
        if (creditError) throw creditError;
        if (!creditUsed) {
          toast.error("검토 크레딧이 부족합니다.");
          setIsLegalAdviceOpen(false);
          setIsLoadingAdvice(false);
          return;
        }
        
        // 남은 횟수 업데이트
        setRemainingReviews(prev => Math.max(0, prev - 1));
      }

      const contractData = {
        employerName: contract?.employer_name || '',
        workerName: contract?.worker_name || '',
        hourlyWage: contract?.hourly_wage || 0,
        includeWeeklyHolidayPay: contractForm.includeWeeklyHolidayPay,
        startDate: contractForm.startDate || contract?.start_date,
        endDate: contractForm.endDate,
        noEndDate: contractForm.noEndDate,
        workStartTime: contract?.work_start_time || '',
        workEndTime: contract?.work_end_time || '',
        breakTimeMinutes: contract?.break_time_minutes ?? contractForm.breakTimeMinutes,
        workDaysPerWeek: contract?.work_days_per_week ?? contractForm.workDaysPerWeek ?? (contract?.work_days?.length || 0),
        workLocation: contract?.work_location || '',
        paymentMonth: contractForm.paymentMonth,
        paymentDay: contractForm.paymentDay,
        paymentEndOfMonth: contractForm.paymentEndOfMonth,
        jobDescription: contractForm.jobDescription || contract?.job_description,
        isComprehensiveWage: true,
        businessSize: contract?.business_size ?? contractForm.businessSize,
        comprehensiveWageDetails: {
          overtimePerHour: contract?.overtime_per_hour ?? contractForm.comprehensiveWageDetails?.overtimePerHour,
          holidayPerDay: contract?.holiday_per_day ?? contractForm.comprehensiveWageDetails?.holidayPerDay,
          annualLeavePerDay: contract?.annual_leave_per_day ?? contractForm.comprehensiveWageDetails?.annualLeavePerDay,
        },
        // 주휴수당 계산 정보 추가
        wageBreakdown: wageBreakdown ? {
          baseWage: wageBreakdown.baseWage,
          weeklyHolidayPay: wageBreakdown.weeklyHolidayPay,
          totalWage: wageBreakdown.totalWage,
          weeklyWorkHours: wageBreakdown.weeklyWorkHours,
          isWeeklyHolidayEligible: wageBreakdown.isWeeklyHolidayEligible,
        } : null,
      };

      const { data, error } = await supabase.functions.invoke('contract-legal-advice', {
        body: { contractData }
      });

      if (error) throw error;
      
      setLegalAdvice(data);
    } catch (error) {
      console.error("Legal advice error:", error);
      toast.error("법적 조언을 가져오는데 실패했습니다.");
      setIsLegalAdviceOpen(false);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // 근무일수 포맷팅
  const formatWorkDays = () => {
    // DB에 저장된 work_days_per_week 우선 확인
    if (contract?.work_days_per_week) {
      return `주 ${contract.work_days_per_week}일`;
    }
    // contractForm의 workDaysPerWeek 확인
    if (contractForm.workDaysPerWeek) {
      return `주 ${contractForm.workDaysPerWeek}일`;
    }
    // 특정 요일이 설정된 경우
    if (contract?.work_days && contract.work_days.length > 0) {
      return contract.work_days.join(', ');
    }
    return '협의 필요';
  };

  // 임금지급일 포맷팅
  const formatPaymentDay = () => {
    if (contractForm.paymentMonth && (contractForm.paymentEndOfMonth || contractForm.paymentDay)) {
      const month = contractForm.paymentMonth === 'current' ? '당월' : '익월';
      const day = contractForm.paymentEndOfMonth ? '말일' : `${contractForm.paymentDay}일`;
      return `${month} ${day}`;
    }
    return '매월 10일';
  };

  // 계약 기간 포맷팅
  const formatContractPeriod = () => {
    const startDate = contractForm.startDate || contract?.start_date;
    if (!startDate) return '미정';
    
    if (contractForm.noEndDate) {
      return `${startDate} ~ (종료일 없음)`;
    }
    if (contractForm.endDate) {
      return `${startDate} ~ ${contractForm.endDate}`;
    }
    return startDate;
  };

  // 주휴수당 및 임금 상세 계산
  const wageBreakdown = useMemo(() => {
    if (!contract) return null;
    
    const dailyWorkHours = parseWorkTime(
      contract.work_start_time,
      contract.work_end_time,
      contract.break_time_minutes ?? contractForm.breakTimeMinutes ?? 0
    );
    const workDaysPerWeek = contract.work_days_per_week ?? contractForm.workDaysPerWeek ?? contract.work_days?.length ?? 5;
    
    return calculateMonthlyWageBreakdown(
      contract.hourly_wage,
      workDaysPerWeek,
      dailyWorkHours
    );
  }, [contract, contractForm.breakTimeMinutes, contractForm.workDaysPerWeek]);

  // 시간당 주휴수당 계산 (주휴수당 미포함 시 사용)
  const weeklyHolidayPayDetail = useMemo(() => {
    if (!contract) return null;
    
    const dailyWorkHours = parseWorkTime(
      contract.work_start_time,
      contract.work_end_time,
      contract.break_time_minutes ?? contractForm.breakTimeMinutes ?? 0
    );
    const workDaysPerWeek = contract.work_days_per_week ?? contractForm.workDaysPerWeek ?? contract.work_days?.length ?? 5;
    
    return calculateWeeklyHolidayPay(
      contract.hourly_wage,
      workDaysPerWeek,
      dailyWorkHours
    );
  }, [contract, contractForm.breakTimeMinutes, contractForm.workDaysPerWeek]);

  // PDF 데이터 생성 헬퍼
  const getPDFData = (): ContractPDFData => {
    return {
      employerName: contract!.employer_name,
      workerName: contract!.worker_name,
      hourlyWage: contract!.hourly_wage,
      monthlyWage: contractForm.monthlyWage,
      wageType: contractForm.wageType,
      startDate: contract!.start_date,
      endDate: contractForm.endDate,
      noEndDate: contractForm.noEndDate,
      workStartTime: contract!.work_start_time,
      workEndTime: contract!.work_end_time,
      workDays: contract!.work_days,
      workDaysPerWeek: contractForm.workDaysPerWeek,
      workLocation: contract!.work_location,
      businessName: contractForm.businessName || contract!.business_name || undefined,
      jobDescription: contractForm.jobDescription || contract!.job_description || undefined,
      breakTimeMinutes: contractForm.breakTimeMinutes,
      employerSignature: contract!.employer_signature,
      workerSignature: contract!.worker_signature,
      signedAt: contract!.signed_at,
      includeWeeklyHolidayPay: contractForm.includeWeeklyHolidayPay,
      wageBreakdown: wageBreakdown,
      paymentDay: contractForm.paymentDay,
      paymentMonth: contractForm.paymentMonth,
      paymentEndOfMonth: contractForm.paymentEndOfMonth,
      businessSize: contractForm.businessSize,
      comprehensiveWageDetails: contractForm.comprehensiveWageDetails,
    };
  };

  const getPDFFilename = () => `근로계약서_${contract!.worker_name}_${contract!.start_date}.pdf`;

  const handlePreviewPDF = () => {
    if (!contract) return;
    setIsPDFPreviewOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;
    
    setIsDownloadingPDF(true);
    try {
      await generateContractPDF(getPDFData(), getPDFFilename());
      toast.success('PDF가 다운로드되었습니다');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF 생성에 실패했습니다');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="계약서를 불러오는 중..." />
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/employer')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-heading font-semibold text-foreground">근로계약서</h1>
          </div>
        </div>
      </div>

      {/* Contract Document Style */}
      <div className="px-6 py-4">
        <motion.div
          className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Document Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground mb-1">근로계약 당사자</p>
                <p className="text-body-lg font-semibold text-foreground">
                  {contract.employer_name} ↔ {contract.worker_name}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="p-6 space-y-5">
            {/* 근무 기간 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">근무 기간</p>
                <p className="text-body font-medium text-foreground">{formatContractPeriod()}</p>
              </div>
            </div>

            {/* 근무 시간 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">근무 시간</p>
                <p className="text-body font-medium text-foreground">
                  {contract.work_start_time?.slice(0, 5)} ~ {contract.work_end_time?.slice(0, 5)}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5">{formatWorkDays()}</p>
              </div>
            </div>

            {/* 휴게시간 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Coffee className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">휴게시간</p>
                <p className="text-body font-medium text-foreground">
                  {(() => {
                    const breakTime = contract.break_time_minutes ?? contractForm.breakTimeMinutes;
                    if (breakTime === undefined || breakTime === null) return '미정';
                    if (breakTime === 0) return '없음';
                    return `${breakTime}분`;
                  })()}
                </p>
              </div>
            </div>

            {/* 근무 장소 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">근무 장소</p>
                {(contractForm.businessName || contract.business_name) && (
                  <p className="text-body font-semibold text-foreground">{contractForm.businessName || contract.business_name}</p>
                )}
                <p className={`text-body ${(contractForm.businessName || contract.business_name) ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                  {contract.work_location}
                </p>
              </div>
            </div>

            {/* 임금 상세 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">임금</p>
                <p className="text-body-lg font-semibold text-foreground">
                  {contractForm.wageType === 'monthly' && contractForm.monthlyWage ? (
                    <>
                      월급 {contractForm.monthlyWage.toLocaleString()}원
                      {contractForm.includeWeeklyHolidayPay && (
                        <span className="text-caption text-muted-foreground ml-1">(주휴수당 포함)</span>
                      )}
                    </>
                  ) : (
                    <>
                      시급 {contract.hourly_wage.toLocaleString()}원
                      {contractForm.includeWeeklyHolidayPay && (
                        <span className="text-caption text-muted-foreground ml-1">(주휴수당 포함)</span>
                      )}
                    </>
                  )}
                </p>
                
                {/* 주휴수당 자동 계산 표시 - 주휴수당 미포함 시에만 별도 계산 */}
                {wageBreakdown && !contractForm.includeWeeklyHolidayPay && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <p className="text-caption font-medium text-amber-700 dark:text-amber-300">
                        월 예상 급여 내역 (주 {wageBreakdown.weeklyWorkHours}시간 기준)
                      </p>
                    </div>
                    <div className="flex justify-between text-caption">
                      <span className="text-amber-600/80 dark:text-amber-400/80">기본급</span>
                      <span className="font-medium text-amber-700 dark:text-amber-300">
                        {wageBreakdown.baseWage.toLocaleString()}원
                      </span>
                    </div>
                    {wageBreakdown.isWeeklyHolidayEligible ? (
                      <div className="flex justify-between text-caption">
                        <span className="text-amber-600/80 dark:text-amber-400/80">주휴수당</span>
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          {wageBreakdown.weeklyHolidayPay.toLocaleString()}원
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-caption">
                        <span className="text-amber-600/80 dark:text-amber-400/80">주휴수당</span>
                        <span className="text-muted-foreground">
                          미발생 (주 15시간 미만)
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-700 flex justify-between text-body">
                      <span className="font-medium text-amber-700 dark:text-amber-300">월 합계</span>
                      <span className="font-bold text-amber-800 dark:text-amber-200">
                        {wageBreakdown.totalWage.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}

                {/* 주휴수당 포함인 경우 안내 - 시급일 때만 표시 */}
                {wageBreakdown && contractForm.includeWeeklyHolidayPay && contractForm.wageType !== 'monthly' && (
                  <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <p className="text-caption font-medium text-green-700 dark:text-green-300">
                        주휴수당 포함 시급
                      </p>
                    </div>
                    <div className="text-xs text-green-600/80 dark:text-green-400/80 space-y-0.5">
                      <p>• 주 15시간 미만: 동일 시급 적용 (주휴수당 미발생)</p>
                      <p>• 주 15시간 이상: 주휴수당 포함 시급으로 적용</p>
                    </div>
                    <div className="flex justify-between text-caption pt-2 border-t border-green-200 dark:border-green-700">
                      <span className="text-green-600/80 dark:text-green-400/80">월 예상 급여 (주 {Math.round(wageBreakdown.weeklyWorkHours)}시간 기준)</span>
                      <span className="font-bold text-green-700 dark:text-green-300">
                        {Math.round(contract.hourly_wage * wageBreakdown.weeklyWorkHours * 4.345).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 임금 지급일 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">임금 지급일</p>
                <p className="text-body font-medium text-foreground">{formatPaymentDay()}</p>
              </div>
            </div>

            {/* 업무 내용 */}
            {(contract.job_description || contractForm.jobDescription) && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-caption text-muted-foreground mb-1">업무 내용</p>
                  <p className="text-body font-medium text-foreground">
                    {contractForm.jobDescription || contract.job_description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 포괄임금계약 명시 */}
          <div className="px-6 pb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-caption font-medium text-blue-700 dark:text-blue-300">
                  포괄임금계약서 {(() => {
                    const size = contract.business_size ?? contractForm.businessSize;
                    if (size === 'over5') return '(5인 이상 사업장)';
                    if (size === 'under5') return '(5인 미만 사업장)';
                    return '';
                  })()}
                </p>
              </div>
              <p className="text-caption text-blue-600/80 dark:text-blue-400/80">
                본 계약서에는 아래 명시된 수당이 포함되어 있습니다.
              </p>
              
              {/* 기본급/주휴수당 분리 명시 (주휴수당 미포함 시에만) */}
              {wageBreakdown && !contractForm.includeWeeklyHolidayPay && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
                  <p className="text-caption font-medium text-blue-700 dark:text-blue-300">임금 구성 내역</p>
                  <div className="flex justify-between text-caption">
                    <span className="text-blue-600/80 dark:text-blue-400/80">기본 시급</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {contract.hourly_wage.toLocaleString()}원
                    </span>
                  </div>
                  {weeklyHolidayPayDetail?.isEligible && (
                    <div className="flex justify-between text-caption">
                      <span className="text-blue-600/80 dark:text-blue-400/80">주휴수당 (1시간당)</span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        {weeklyHolidayPayDetail.weeklyHolidayPayPerHour.toLocaleString()}원
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-caption pt-1 border-t border-blue-200/50 dark:border-blue-700/50">
                    <span className="text-blue-600/80 dark:text-blue-400/80">기본급 (월)</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {wageBreakdown.baseWage.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span className="text-blue-600/80 dark:text-blue-400/80">주휴수당 (월)</span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {wageBreakdown.isWeeklyHolidayEligible 
                        ? `${wageBreakdown.weeklyHolidayPay.toLocaleString()}원`
                        : '해당없음 (주 15시간 미만)'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* 주휴수당 포함인 경우 안내 */}
              {contractForm.includeWeeklyHolidayPay && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
                  <p className="text-caption font-medium text-blue-700 dark:text-blue-300">임금 구성 내역</p>
                  <div className="flex justify-between text-caption">
                    <span className="text-blue-600/80 dark:text-blue-400/80">
                      {contractForm.wageType === 'monthly' ? '월급 (주휴수당 포함)' : '시급 (주휴수당 포함)'}
                    </span>
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {contractForm.wageType === 'monthly' && contractForm.monthlyWage
                        ? `${contractForm.monthlyWage.toLocaleString()}원`
                        : `${contract.hourly_wage.toLocaleString()}원`}
                    </span>
                  </div>
                  <div className="mt-2 p-2 rounded-lg bg-blue-100/50 dark:bg-blue-800/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">주휴수당 적용 기준</p>
                    <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 space-y-0.5">
                      <li>• 주 15시간 미만 근무 시: 동일 {contractForm.wageType === 'monthly' ? '월급' : '시급'} 적용 (주휴수당 미발생)</li>
                      <li>• 주 15시간 이상 근무 시: 주휴수당이 포함된 {contractForm.wageType === 'monthly' ? '월급' : '시급'}으로 적용</li>
                    </ul>
                  </div>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    ※ 주휴수당 발생 여부와 관계없이 명시된 {contractForm.wageType === 'monthly' ? '월급' : '시급'}을 일괄 지급하므로 별도 계산하지 않습니다.
                  </p>
                </div>
              )}
              
              {/* 5인 이상 사업장: 포괄임금 수당 세부 내역 (법적 요건 준수) */}
              {(() => {
                // DB 값 우선, 5인 이상일 때만 추가수당 표시
                const size = contract.business_size ?? contractForm.businessSize;
                if (size !== 'over5') return null;
                
                const overtime = contract.overtime_per_hour ?? contractForm.comprehensiveWageDetails?.overtimePerHour;
                const holiday = contract.holiday_per_day ?? contractForm.comprehensiveWageDetails?.holidayPerDay;
                const annual = contract.annual_leave_per_day ?? contractForm.comprehensiveWageDetails?.annualLeavePerDay;
                
                if (overtime || holiday || annual) {
                  // 일일 근무시간 계산
                  const breakTime = contract.break_time_minutes ?? contractForm.breakTimeMinutes ?? 0;
                  const dailyHours = parseWorkTime(
                    contract.work_start_time || contractForm.workStartTime || '09:00',
                    contract.work_end_time || contractForm.workEndTime || '18:00',
                    breakTime
                  );
                  
                  // 고정 연장근로 시간 계산 (일 8시간 초과분)
                  const workDaysPerWeek = contractForm.workDaysPerWeek || contract.work_days?.length || 5;
                  const dailyOvertimeHours = Math.max(0, dailyHours - 8);
                  const weeklyOvertimeHours = dailyOvertimeHours * workDaysPerWeek;
                  const monthlyOvertimeHours = Math.round(weeklyOvertimeHours * 4.345 * 10) / 10;
                  
                  // 월 고정 연장근로수당
                  const monthlyOvertimePay = overtime ? Math.round(overtime * monthlyOvertimeHours) : 0;
                  
                  return (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-3">
                      <p className="text-caption font-medium text-blue-700 dark:text-blue-300">
                        포괄임금 수당 내역
                      </p>
                      
                      {/* 연장근로수당 - 포괄임금에 포함 (고정 시간/금액 명시) */}
                      {overtime && monthlyOvertimeHours > 0 && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">포함</span>
                            </div>
                            <span className="text-caption font-bold text-blue-800 dark:text-blue-200">연장근로수당</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-caption">
                            <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20">
                              <p className="text-[10px] text-blue-500 dark:text-blue-400 mb-0.5">월 고정 연장근로시간</p>
                              <p className="font-bold text-blue-800 dark:text-blue-200">{monthlyOvertimeHours}시간</p>
                            </div>
                            <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20">
                              <p className="text-[10px] text-blue-500 dark:text-blue-400 mb-0.5">월 고정 지급액</p>
                              <p className="font-bold text-blue-800 dark:text-blue-200">{monthlyOvertimePay.toLocaleString()}원</p>
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-blue-600/70 dark:text-blue-400/60">
                            • 시간당 {overtime.toLocaleString()}원 (기본시급의 150%)
                          </p>
                          <p className="text-[10px] text-blue-600/70 dark:text-blue-400/60">
                            • 일 {dailyOvertimeHours}시간 × 주 {workDaysPerWeek}일 × 4.345주 = 월 {monthlyOvertimeHours}시간
                          </p>
                        </div>
                      )}
                      
                      {/* 휴일근로수당 - 포괄임금 미포함 (발생 시 별도 지급) */}
                      {holiday && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">별도</span>
                            </div>
                            <span className="text-caption font-bold text-amber-800 dark:text-amber-200">휴일근로수당</span>
                          </div>
                          
                          <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20">
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-0.5">휴일근로 시 지급 단가</p>
                            <p className="font-bold text-amber-800 dark:text-amber-200">1일당 {holiday.toLocaleString()}원</p>
                          </div>
                          
                          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60">
                            ※ 휴일근로는 사전 예측이 불가하여 포괄임금에 미포함
                          </p>
                          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60">
                            ※ 휴일 근무 발생 시 실제 근무시간에 따라 별도 지급
                          </p>
                        </div>
                      )}
                      
                      {/* 연차유급휴가수당 - 포괄임금 미포함 (사후 정산 원칙) */}
                      {annual && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">제외</span>
                            </div>
                            <span className="text-caption font-bold text-red-800 dark:text-red-200">연차유급휴가 수당</span>
                          </div>
                          
                          <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20">
                            <p className="text-[10px] text-red-600 dark:text-red-400 mb-0.5">연차 미사용 시 정산 단가</p>
                            <p className="font-bold text-red-800 dark:text-red-200">1일당 {annual.toLocaleString()}원</p>
                          </div>
                          
                          <div className="p-2 rounded-lg bg-red-100/50 dark:bg-red-900/30 border border-red-200/50 dark:border-red-700/50">
                            <p className="text-[10px] font-medium text-red-700 dark:text-red-300 mb-1">⚠️ 법적 안내</p>
                            <p className="text-[10px] text-red-600/80 dark:text-red-400/60">
                              연차수당의 사전 매수(포괄)는 근로자의 연차 사용권을 침해할 수 있어 법적 위험이 있습니다. 
                              연차는 사후 정산이 원칙이므로 미사용 연차에 대해 퇴직 시 또는 연차 사용기간 만료 시 정산합니다.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* 월급 총액 구성 요약 */}
                      <div className="pt-3 border-t border-blue-200/50 dark:border-blue-700/50 space-y-2">
                        <p className="text-caption font-medium text-blue-700 dark:text-blue-300">월급 총액 구성</p>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-caption">
                            <span className="text-blue-600/80 dark:text-blue-400/80">기본급 + 주휴수당</span>
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                              {wageBreakdown ? wageBreakdown.totalWage.toLocaleString() : '-'}원
                            </span>
                          </div>
                          
                          {overtime && monthlyOvertimeHours > 0 && (
                            <div className="flex justify-between text-caption">
                              <span className="text-blue-600/80 dark:text-blue-400/80">
                                + 연장근로수당 (월 {monthlyOvertimeHours}시간 고정)
                              </span>
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                {monthlyOvertimePay.toLocaleString()}원
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-1.5 border-t border-blue-200/50 dark:border-blue-700/50 flex justify-between text-body">
                            <span className="font-medium text-blue-700 dark:text-blue-300">포괄임금 월 총액</span>
                            <span className="font-bold text-blue-800 dark:text-blue-200">
                              {((wageBreakdown?.totalWage || 0) + monthlyOvertimePay).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-blue-500/70 dark:text-blue-400/50 mt-2">
                          ※ 휴일근로·연차수당은 발생/정산 시 별도 지급
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Contract Verification Section */}
          <div className="px-6 pb-6 space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-caption font-medium text-blue-700 dark:text-blue-300">
                  근로기준법 기반 표준계약서
                </p>
              </div>
              <p className="text-caption text-blue-600/80 dark:text-blue-400/80">
                서명 전 계약서 검토를 권장드립니다.
              </p>
            </div>

            {/* AI 노무사 검토 Button */}
            <motion.button
              onClick={handleGetLegalAdvice}
              disabled={isLoadingReviews}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700 hover:shadow-lg hover:border-amber-400 transition-all relative overflow-hidden disabled:opacity-50"
              whileTap={{ scale: 0.98 }}
            >
              {/* 반짝이는 효과 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                      <Scale className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-base font-bold text-amber-800 dark:text-amber-200">
                      AI 노무사 검토
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-bold text-white">
                      PRO
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-800/50">
                    <Zap className="w-3 h-3 text-amber-600 dark:text-amber-300" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">3초</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-12">
                  {isLoadingReviews ? (
                    <span className="text-sm text-muted-foreground">확인 중...</span>
                  ) : remainingReviews > 0 ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      무료 {remainingReviews}회 남음
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      무료 소진
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">· 추가 1,000원/회</span>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 py-8 space-y-3">
        {!isSigned ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                size="full"
                onClick={() => setIsSignatureOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 relative overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <Sparkles className="w-5 h-5 mr-2" />
                서명하고 계약서 완성하기
              </Button>
            </motion.div>
            
            {/* 계약서 수정 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Button
                variant="outline"
                size="full"
                onClick={() => navigate(`/employer/create?edit=${id}`)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                근로계약서 내용 수정하기
              </Button>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                size="full"
                onClick={handleShare}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 gap-2 relative overflow-hidden"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <Share2 className="w-5 h-5" />
                근로자에게 보내기
              </Button>
            </motion.div>
            <motion.div
              className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-body font-medium">사업주 서명 완료</span>
            </motion.div>
            {/* Chat with Worker Button - Show for signed contracts or demo */}
            {(contract.worker_id || isDemo) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="full"
                      onClick={async () => {
                        if (isDemo) {
                          toast.info('데모 모드에서는 채팅 기능을 체험할 수 없어요. 로그인 후 이용해주세요!');
                          return;
                        }
                        if (!user || !contract.worker_id) return;
                        try {
                          await getOrCreateChatRoom(user.id, contract.worker_id);
                          navigate('/employer/chat');
                        } catch (error) {
                          console.error('Error creating chat room:', error);
                          toast.error('채팅방 생성에 실패했습니다');
                        }
                      }}
                      className="gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {contract.worker_name}님과 대화하기
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>임금명세서나 파일을 보낼 수 있어요 💬</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}

            {/* Worker Review Button - Only for completed contracts */}
            {contract.status === 'completed' && contract.worker_id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant={existingReview ? "outline" : "default"}
                  size="full"
                  onClick={() => {
                    if (isDemo) {
                      toast.info('데모 모드에서는 평가 기능을 체험할 수 없어요. 로그인 후 이용해주세요!');
                      return;
                    }
                    setIsReviewModalOpen(true);
                  }}
                  className="gap-2"
                >
                  <Star className={`w-5 h-5 ${existingReview ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  {existingReview ? (
                    <>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${RATING_COLORS[existingReview.rating]}`}>
                        {RATING_LABELS[existingReview.rating]}
                      </span>
                      평가 수정하기
                    </>
                  ) : (
                    `${contract.worker_name}님 평가하기`
                  )}
                </Button>
              </motion.div>
            )}
            
            {/* PDF Preview Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button
                variant="outline"
                size="full"
                onClick={handlePreviewPDF}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF 미리보기
              </Button>
            </motion.div>

            {/* PDF Download Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                variant="outline"
                size="full"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="gap-2"
              >
                {isDownloadingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    PDF 생성 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    PDF 다운로드
                  </>
                )}
              </Button>
            </motion.div>
          </>
        )}
      </div>

      {/* Worker Review Modal */}
      {contract.worker_id && user && (
        <WorkerReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            // Refresh the review after closing
            if (id) {
              getReviewByContract(id).then(setExistingReview).catch(console.error);
            }
          }}
          contractId={contract.id}
          employerId={user.id}
          workerId={contract.worker_id}
          workerName={contract.worker_name}
        />
      )}

      {/* Signature Canvas Modal */}
      <SignatureCanvas
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onSave={handleSign}
      />

      {/* Legal Advice Modal */}
      <AnimatePresence>
        {isLegalAdviceOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLegalAdviceOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg bg-background rounded-t-3xl max-h-[85vh] flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-body-lg font-semibold text-foreground">계약서 검토 결과</h3>
                    <p className="text-caption text-muted-foreground">근로기준법 준수 여부 분석</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLegalAdviceOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingAdvice ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    <p className="text-body text-muted-foreground">계약서를 분석하고 있어요...</p>
                  </div>
                ) : legalAdvice ? (
                  <div className="space-y-5">
                    {/* Grade Badge */}
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                      legalAdvice.grade === '완벽' 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : legalAdvice.grade === '양호'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        legalAdvice.grade === '완벽'
                          ? 'bg-green-100 dark:bg-green-900/50'
                          : legalAdvice.grade === '양호'
                          ? 'bg-amber-100 dark:bg-amber-900/50'
                          : 'bg-red-100 dark:bg-red-900/50'
                      }`}>
                        {legalAdvice.grade === '완벽' && <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />}
                        {legalAdvice.grade === '양호' && <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />}
                        {legalAdvice.grade === '나쁨' && <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-heading font-bold ${
                          legalAdvice.grade === '완벽'
                            ? 'text-green-700 dark:text-green-300'
                            : legalAdvice.grade === '양호'
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {legalAdvice.grade}
                        </p>
                        <p className={`text-caption ${
                          legalAdvice.grade === '완벽'
                            ? 'text-green-600/80 dark:text-green-400/80'
                            : legalAdvice.grade === '양호'
                            ? 'text-amber-600/80 dark:text-amber-400/80'
                            : 'text-red-600/80 dark:text-red-400/80'
                        }`}>
                          {legalAdvice.summary}
                        </p>
                      </div>
                    </div>

                    {/* Issues List */}
                    {legalAdvice.issues && legalAdvice.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-body font-semibold text-foreground">수정이 필요한 항목</p>
                        <div className="space-y-2">
                          {legalAdvice.issues.map((issue, index) => (
                            <div 
                              key={index}
                              className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-caption text-red-700 dark:text-red-300">{issue}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advice */}
                    {legalAdvice.advice && (
                      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                        <p className="text-body font-semibold text-foreground mb-2">상세 조언</p>
                        <p className="text-caption text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {legalAdvice.advice}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-border space-y-3">
              {legalAdvice && legalAdvice.grade !== '완벽' && (
                  <>
                    {contract && (isDemo || isContractEditable(contract.created_at)) ? (
                      <Button
                        size="full"
                        onClick={() => {
                          setIsLegalAdviceOpen(false);
                          navigate('/employer/create');
                        }}
                        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        계약서 수정하기
                        {isDemo && (
                          <span className="text-xs opacity-80 ml-1">(데모)</span>
                        )}
                      </Button>
                    ) : (
                      <div className="p-3 rounded-xl bg-muted border border-border text-center">
                        <p className="text-caption text-muted-foreground">
                          수정 가능 기간({CONTRACT_EDIT_PERIOD_DAYS}일)이 지나 수정할 수 없습니다
                        </p>
                      </div>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  size="full"
                  onClick={() => setIsLegalAdviceOpen(false)}
                >
                  닫기
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Contract Modal */}
      {contract && (
        <ShareContractModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          contractId={contract.id}
          workerName={contract.worker_name}
        />
      )}

      {/* PDF Preview Modal */}
      {contract && (
        <PDFPreviewModal
          isOpen={isPDFPreviewOpen}
          onClose={() => setIsPDFPreviewOpen(false)}
          pdfData={getPDFData()}
          filename={getPDFFilename()}
        />
      )}
    </div>
  );
}
