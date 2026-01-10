import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { toast } from "sonner";
import { getContract, signContractAsEmployer, Contract } from "@/lib/contract-api";

export default function ContractPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { isDemo, contracts: demoContracts, updateContract: updateDemoContract, contractForm } = useAppStore();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

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
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("링크가 복사되었습니다!");
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

            {/* 근무 일수 */}
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

            {/* 근무 장소 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">근무 장소</p>
                <p className="text-body font-medium text-foreground">{contract.work_location}</p>
              </div>
            </div>

            {/* 임금 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground mb-1">임금</p>
                <p className="text-body-lg font-semibold text-foreground">
                  시급 {contract.hourly_wage.toLocaleString()}원
                  {contractForm.includeWeeklyHolidayPay && (
                    <span className="text-caption text-primary ml-2">(주휴수당 포함)</span>
                  )}
                </p>
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

          {/* AI Notice */}
          <div className="px-6 pb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <p className="text-caption font-medium text-violet-700 dark:text-violet-300">
                  AI가 생성한 계약서입니다
                </p>
              </div>
              <p className="text-caption text-violet-600/80 dark:text-violet-400/80">
                최신 근로기준법에 맞게 작성되었습니다.
              </p>
            </div>
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
          </>
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
