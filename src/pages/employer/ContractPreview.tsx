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
  Edit,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { getContract, signContractAsEmployer, Contract } from "@/lib/contract-api";
import { supabase } from "@/integrations/supabase/client";
import { parseWorkTime, calculateMonthlyWageBreakdown, calculateWeeklyHolidayPay } from "@/lib/wage-utils";
import { generateContractPDF, ContractPDFData } from "@/lib/pdf-utils";

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

  const handleShare = async () => {
    if (!contract) return;
    
    const shareUrl = `${window.location.origin}/worker/contract/${contract.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '근로계약서',
          text: `${contract.worker_name}님, 근로계약서가 도착했습니다.`,
          url: shareUrl,
        });
        toast.success("계약서가 공유되었습니다!");
        navigate('/employer');
      } catch (err) {
        // 사용자가 공유를 취소한 경우
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareUrl);
          navigate('/employer');
        }
      }
    } else {
      copyToClipboard(shareUrl);
      navigate('/employer');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("링크가 복사되었습니다!");
  };

  const handleGetLegalAdvice = async () => {
    if (legalAdvice) {
      setIsLegalAdviceOpen(true);
      return;
    }

    setIsLegalAdviceOpen(true);
    setIsLoadingAdvice(true);

    try {
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
        breakTimeMinutes: contractForm.breakTimeMinutes,
        workDaysPerWeek: contractForm.workDaysPerWeek,
        workLocation: contract?.work_location || '',
        paymentMonth: contractForm.paymentMonth,
        paymentDay: contractForm.paymentDay,
        paymentEndOfMonth: contractForm.paymentEndOfMonth,
        jobDescription: contractForm.jobDescription || contract?.job_description,
        isComprehensiveWage: true,
        businessSize: contractForm.businessSize, // 5인 미만/이상
        comprehensiveWageDetails: contractForm.comprehensiveWageDetails, // 포괄임금 수당 세부
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
    if (contractForm.workDaysPerWeek) {
      return `주 ${contractForm.workDaysPerWeek}일`;
    }
    if (contract?.work_days && contract.work_days.length > 0) {
      return contract.work_days.join(', ');
    }
    return '미정';
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
      contractForm.breakTimeMinutes || 0
    );
    const workDaysPerWeek = contractForm.workDaysPerWeek || contract.work_days?.length || 5;
    
    return calculateMonthlyWageBreakdown(
      contract.hourly_wage,
      workDaysPerWeek,
      dailyWorkHours
    );
  }, [contract, contractForm.breakTimeMinutes, contractForm.workDaysPerWeek]);

  const handleDownloadPDF = async () => {
    if (!contract) return;
    
    setIsDownloadingPDF(true);
    try {
      const pdfData: ContractPDFData = {
        employerName: contract.employer_name,
        workerName: contract.worker_name,
        hourlyWage: contract.hourly_wage,
        monthlyWage: contractForm.monthlyWage,
        wageType: contractForm.wageType,
        startDate: contract.start_date,
        endDate: contractForm.endDate,
        workStartTime: contract.work_start_time,
        workEndTime: contract.work_end_time,
        workDays: contract.work_days,
        workLocation: contract.work_location,
        businessName: contractForm.businessName || contract.business_name || undefined,
        jobDescription: contractForm.jobDescription || contract.job_description || undefined,
        breakTimeMinutes: contractForm.breakTimeMinutes,
        employerSignature: contract.employer_signature,
        workerSignature: contract.worker_signature,
        signedAt: contract.signed_at,
        includeWeeklyHolidayPay: contractForm.includeWeeklyHolidayPay,
        wageBreakdown: wageBreakdown,
      };
      
      const filename = `근로계약서_${contract.worker_name}_${contract.start_date}.pdf`;
      await generateContractPDF(pdfData, filename);
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
                  {contract.work_start_time} ~ {contract.work_end_time}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5">{formatWorkDays()}</p>
              </div>
            </div>

            {/* 휴게시간 */}
            {contractForm.breakTimeMinutes !== undefined && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-caption text-muted-foreground mb-1">휴게시간</p>
                  <p className="text-body font-medium text-foreground">
                    {contractForm.breakTimeMinutes === 0 ? '없음' : `${contractForm.breakTimeMinutes}분`}
                  </p>
                </div>
              </div>
            )}

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
                  포괄임금계약서 {contractForm.businessSize === 'over5' ? '(5인 이상 사업장)' : contractForm.businessSize === 'under5' ? '(5인 미만 사업장)' : ''}
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
              
              {/* 5인 이상 사업장: 추가 포괄임금 수당 세부 내역 (단위당) */}
              {contractForm.businessSize === 'over5' && contractForm.comprehensiveWageDetails && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 space-y-2">
                  <p className="text-caption font-medium text-blue-700 dark:text-blue-300">추가 수당 내역 (단위당)</p>
                  {contractForm.comprehensiveWageDetails.overtimePerHour && (
                    <div className="flex justify-between text-caption">
                      <span className="text-blue-600/80 dark:text-blue-400/80">연장근로수당 (1시간당)</span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">{contractForm.comprehensiveWageDetails.overtimePerHour.toLocaleString()}원</span>
                    </div>
                  )}
                  {contractForm.comprehensiveWageDetails.holidayPerDay && (
                    <div className="flex justify-between text-caption">
                      <span className="text-blue-600/80 dark:text-blue-400/80">휴일근로수당 (1일당)</span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">{contractForm.comprehensiveWageDetails.holidayPerDay.toLocaleString()}원</span>
                    </div>
                  )}
                  {contractForm.comprehensiveWageDetails.annualLeavePerDay && (
                    <div className="flex justify-between text-caption">
                      <span className="text-blue-600/80 dark:text-blue-400/80">연차유급휴가 수당 (1일당)</span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">{contractForm.comprehensiveWageDetails.annualLeavePerDay.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Legal Advice Section */}
          <div className="px-6 pb-6 space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <p className="text-caption font-medium text-violet-700 dark:text-violet-300">
                  AI가 생성한 계약서입니다
                </p>
              </div>
              <p className="text-caption text-violet-600/80 dark:text-violet-400/80">
                아래 버튼을 눌러 법적 검토를 받아보세요.
              </p>
            </div>

            {/* AI Legal Advice Button */}
            <motion.button
              onClick={handleGetLegalAdvice}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 hover:shadow-md transition-all"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-body font-medium text-emerald-700 dark:text-emerald-300">
                  AI 법적 조언 받기
                </p>
                <p className="text-caption text-emerald-600/70 dark:text-emerald-400/70">
                  계약서의 법적 적합성을 분석해드려요
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 py-8 space-y-3">
        {!isSigned ? (
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
            {/* PDF Download Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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
                    <h3 className="text-body-lg font-semibold text-foreground">AI 법적 조언</h3>
                    <p className="text-caption text-muted-foreground">계약서 분석 결과</p>
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
                  </Button>
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
    </div>
  );
}
