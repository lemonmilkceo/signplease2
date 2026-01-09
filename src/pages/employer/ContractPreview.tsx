import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { ContractCard } from "@/components/ui/card-slide";
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
} from "lucide-react";
import { toast } from "sonner";
import { getContract, signContractAsEmployer, Contract } from "@/lib/contract-api";

export default function ContractPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { isDemo, contracts: demoContracts, updateContract: updateDemoContract } = useAppStore();
  
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/employer')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-heading font-semibold text-foreground">계약서 미리보기</h1>
        </div>
      </div>

      {/* Contract Cards */}
      <div className="px-6 py-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ContractCard
            title="근로자"
            value={contract.worker_name}
            icon={<User className="w-6 h-6" />}
            highlight
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ContractCard
            title="시급"
            value={`${contract.hourly_wage.toLocaleString()}원`}
            icon={<Wallet className="w-6 h-6" />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ContractCard
            title="근무 시작일"
            value={contract.start_date}
            icon={<Calendar className="w-6 h-6" />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ContractCard
            title="근무 시간"
            value={`${contract.work_start_time} - ${contract.work_end_time} (${contract.work_days.join(', ')})`}
            icon={<Clock className="w-6 h-6" />}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ContractCard
            title="근무 장소"
            value={contract.work_location}
            icon={<MapPin className="w-6 h-6" />}
          />
        </motion.div>
      </div>

      {/* AI Generated Notice */}
      <motion.div
        className="mx-6 p-4 rounded-2xl bg-accent border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <p className="text-caption text-primary font-medium mb-1">
          ✨ AI가 생성한 계약서입니다
        </p>
        <p className="text-caption text-muted-foreground">
          최신 근로기준법에 맞게 작성되었습니다. 추가 조항이 필요하시면 직접 수정할 수 있어요.
        </p>
      </motion.div>

      {/* Bottom Buttons */}
      <div className="px-6 py-8 space-y-3">
        {!isSigned ? (
          <Button
            variant="toss"
            size="full"
            onClick={() => setIsSignatureOpen(true)}
          >
            서명하기
          </Button>
        ) : (
          <>
            <Button
              variant="toss"
              size="full"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="w-5 h-5" />
              근로자에게 보내기
            </Button>
            <motion.div
              className="flex items-center justify-center gap-2 text-success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Check className="w-5 h-5" />
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
