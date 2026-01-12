import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Coins, Sparkles, AlertCircle } from "lucide-react";

interface NoCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingCredits: number;
}

export function NoCreditModal({ open, onOpenChange, remainingCredits }: NoCreditModalProps) {
  const navigate = useNavigate();

  const handleGoToPricing = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4"
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
          </motion.div>
          <DialogTitle className="text-xl">크레딧이 부족해요</DialogTitle>
          <DialogDescription className="text-center">
            계약서를 작성하려면 크레딧이 필요합니다
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Current Credits */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
              <Coins className="w-4 h-4" />
              <span className="font-semibold">잔여 크레딧: {remainingCredits}건</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-muted/50 rounded-2xl p-4 mb-6">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              크레딧 충전 혜택
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                건당 2,000원부터 시작
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                대량 구매 시 최대 40% 할인
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                무제한 보관 및 PDF 다운로드
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleGoToPricing}
            variant="toss"
            size="lg"
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            요금제 보기
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            나중에
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
