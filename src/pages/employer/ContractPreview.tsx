import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { ContractCard } from "@/components/ui/card-slide";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
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

export default function ContractPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contracts, updateContract } = useAppStore();
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">계약서를 찾을 수 없습니다</p>
      </div>
    );
  }

  const handleSign = (signatureData: string) => {
    updateContract(contract.id!, { employerSignature: signatureData, status: 'pending' });
    setIsSigned(true);
    toast.success("서명이 완료되었습니다!");
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/worker/contract/${contract.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '근로계약서',
          text: `${contract.workerName}님, 근로계약서가 도착했습니다.`,
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
            value={contract.workerName}
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
            value={`${contract.hourlyWage.toLocaleString()}원`}
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
            value={contract.startDate}
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
            value={`${contract.workStartTime} - ${contract.workEndTime} (${contract.workDays.join(', ')})`}
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
            value={contract.workLocation}
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
