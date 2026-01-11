import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getContract, signContractAsWorker, explainTerm, Contract } from "@/lib/contract-api";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import { parseWorkTime, calculateMonthlyWageBreakdown } from "@/lib/wage-utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Wallet,
  User,
  CheckCircle2,
  Loader2,
  Sparkles,
  Coffee,
  Briefcase,
  CreditCard,
  FileCheck,
  Info,
  FileText,
  HelpCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkerContractView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [helpTerm, setHelpTerm] = useState<string | null>(null);
  const [helpExplanation, setHelpExplanation] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

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

  // 주휴수당 및 임금 상세 계산
  const wageBreakdown = useMemo(() => {
    if (!contract) return null;
    
    const dailyWorkHours = parseWorkTime(
      contract.work_start_time,
      contract.work_end_time,
      0 // 휴게시간 정보가 없으면 0
    );
    const workDaysPerWeek = contract.work_days?.length || 5;
    
    return calculateMonthlyWageBreakdown(
      contract.hourly_wage,
      workDaysPerWeek,
      dailyWorkHours
    );
  }, [contract]);

  const handleHelpClick = async (term: string, context: string) => {
    if (helpTerm === term) {
      setHelpTerm(null);
      setHelpExplanation(null);
      return;
    }

    setHelpTerm(term);
    setLoadingHelp(true);
    setHelpExplanation(null);

    try {
      const explanation = await explainTerm(term, context);
      setHelpExplanation(explanation);
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast.error('설명을 불러오는데 실패했습니다');
      setHelpTerm(null);
    } finally {
      setLoadingHelp(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!contract?.id) return;
    
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

  const isCompleted = contract.status === 'completed';

  // AI 도움말 버튼 컴포넌트
  const HelpButton = ({ term, context }: { term: string; context: string }) => (
    <button
      onClick={() => handleHelpClick(term, context)}
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
        helpTerm === term 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      }`}
    >
      {helpTerm === term ? (
        <X className="w-3 h-3" />
      ) : (
        <HelpCircle className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/worker')}
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

      {/* AI Help Tooltip */}
      <AnimatePresence>
        {helpTerm && (
          <motion.div
            className="mx-6 mb-4 p-4 bg-gradient-to-br from-primary/10 to-accent rounded-2xl border border-primary/20"
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
                <div>
                  <p className="text-caption font-medium text-foreground mb-1">{helpTerm}</p>
                  <p className="text-caption text-muted-foreground leading-relaxed">
                    {helpExplanation}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contract Document */}
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
            {/* 근무 시작일 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-caption text-muted-foreground">근무 시작일</p>
                  <HelpButton term="근무 시작일" context="근로계약서의 근무 시작일 항목" />
                </div>
                <p className="text-body font-medium text-foreground">{contract.start_date}</p>
              </div>
            </div>

            {/* 근무 시간 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-caption text-muted-foreground">근무 시간</p>
                  <HelpButton term="근무 시간" context="근로계약서의 근무 시간 항목" />
                </div>
                <p className="text-body font-medium text-foreground">
                  {contract.work_start_time} ~ {contract.work_end_time}
                </p>
                <p className="text-caption text-muted-foreground mt-0.5">
                  매주 {contract.work_days.join(', ')}
                </p>
              </div>
            </div>

            {/* 근무 장소 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-caption text-muted-foreground">근무 장소</p>
                  <HelpButton term="근무 장소" context="근로계약서의 근무 장소 항목" />
                </div>
                <p className="text-body font-medium text-foreground">{contract.work_location}</p>
              </div>
            </div>

            {/* 업무 내용 */}
            {contract.job_description && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-caption text-muted-foreground">업무 내용</p>
                    <HelpButton term="업무 내용" context="근로계약서의 업무 내용 항목" />
                  </div>
                  <p className="text-body font-medium text-foreground">{contract.job_description}</p>
                </div>
              </div>
            )}

            {/* 임금 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-caption text-muted-foreground">시급</p>
                  <HelpButton term="시급" context="근로계약서의 시급 항목" />
                </div>
                <p className="text-body-lg font-semibold text-foreground">
                  {contract.hourly_wage.toLocaleString()}원
                </p>
                
                {/* 주휴수당 계산 표시 */}
                {wageBreakdown && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <p className="text-caption font-medium text-amber-700 dark:text-amber-300">
                        월 예상 급여 내역 (주 {Math.round(wageBreakdown.weeklyWorkHours)}시간 기준)
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
              </div>
            </div>
          </div>

          {/* 주휴수당 안내 */}
          <div className="px-6 pb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-caption font-medium text-green-700 dark:text-green-300">
                  주휴수당 안내
                </p>
              </div>
              <div className="text-xs text-green-600/80 dark:text-green-400/80 space-y-1">
                <p>• 주 15시간 미만 근무: 주휴수당 미발생</p>
                <p>• 주 15시간 이상 근무: 주휴수당 발생 (1일분 유급휴일)</p>
              </div>
              <p className="text-xs text-green-600/60 dark:text-green-400/60 mt-2">
                ※ 주휴수당은 일주일간 소정근로일을 개근한 경우 지급됩니다.
              </p>
            </div>
          </div>

          {/* 서명 상태 */}
          <div className="px-6 pb-6">
            <div className="p-4 rounded-2xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    contract.employer_signature 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-muted'
                  }`}>
                    {contract.employer_signature ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">사업주 서명</p>
                    <p className="text-body font-medium text-foreground">
                      {contract.employer_signature ? '완료' : '대기 중'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    contract.worker_signature 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-muted'
                  }`}>
                    {contract.worker_signature ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">근로자 서명</p>
                    <p className="text-body font-medium text-foreground">
                      {contract.worker_signature ? '완료' : '대기 중'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Button */}
      <div className="px-6 py-8">
        {isCompleted ? (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
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