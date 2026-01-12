import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const BANKS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "IBK기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "SC제일은행",
  "씨티은행",
  "DGB대구은행",
  "BNK부산은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "제주은행",
  "수협은행",
  "새마을금고",
  "신협",
  "우체국",
];

export default function WorkerOnboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [residentNumber, setResidentNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // Format resident number with hyphen (000000-0000000)
  const formatResidentNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 6) {
      return numbers;
    }
    return `${numbers.slice(0, 6)}-${numbers.slice(6, 13)}`;
  };

  const handleResidentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatResidentNumber(e.target.value);
    setResidentNumber(formatted);
  };

  // Format bank account with spaces for readability
  const formatBankAccount = (value: string) => {
    return value.replace(/[^0-9-]/g, "");
  };

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBankAccount(e.target.value);
    setBankAccount(formatted);
  };

  const handleSkip = () => {
    navigate("/worker");
  };

  const handleSubmit = async () => {
    // Validation
    const cleanResidentNumber = residentNumber.replace(/-/g, "");
    if (cleanResidentNumber && cleanResidentNumber.length !== 13) {
      toast.error("주민등록번호 13자리를 정확히 입력해주세요.");
      return;
    }

    if ((bankName && !bankAccount) || (!bankName && bankAccount)) {
      toast.error("은행명과 계좌번호를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        resident_number: residentNumber || null,
        bank_name: bankName || null,
        bank_account: bankAccount || null,
      });
      toast.success("정보가 저장되었어요! 🎉");
      navigate("/worker");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormFilled = residentNumber || (bankName && bankAccount);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-caption text-primary font-medium">한 번만 입력하면 끝!</span>
          </div>
          <h1 className="text-title text-foreground mb-2">
            계약서 서명이 더 빨라져요
          </h1>
          <p className="text-body text-muted-foreground">
            아래 정보를 미리 입력해두면<br />
            모든 근로계약서에 자동으로 들어가요
          </p>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-4"
        >
          {/* Resident Number */}
          <div className="space-y-2">
            <Label htmlFor="residentNumber" className="text-body font-medium">
              주민등록번호
            </Label>
            <div className="relative">
              <Input
                id="residentNumber"
                type="text"
                inputMode="numeric"
                placeholder="000000-0000000"
                value={residentNumber}
                onChange={handleResidentNumberChange}
                maxLength={14}
                className="text-body h-14 rounded-xl pl-4 pr-12"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-caption text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" />
              암호화되어 안전하게 보관됩니다
            </p>
          </div>

          {/* Bank Info */}
          <div className="space-y-2">
            <Label className="text-body font-medium">
              급여 입금 계좌
            </Label>
            <div className="space-y-3">
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger className="h-14 rounded-xl text-body">
                  <SelectValue placeholder="은행 선택" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="계좌번호 입력 (숫자만)"
                value={bankAccount}
                onChange={handleBankAccountChange}
                maxLength={20}
                className="text-body h-14 rounded-xl"
              />
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-muted/50 rounded-2xl p-4 space-y-3"
        >
          <p className="text-caption font-medium text-foreground">이렇게 편해져요 ✨</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>계약서 서명할 때 다시 입력 안 해도 돼요</span>
            </div>
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>여러 알바 계약도 한 번에 빠르게 처리</span>
            </div>
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>나중에 마이페이지에서 수정 가능해요</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Buttons */}
      <motion.div
        className="px-6 pb-8 pt-4 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="toss"
          size="full"
          onClick={handleSubmit}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <motion.div
              className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              {isFormFilled ? "저장하고 시작하기" : "건너뛰기"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {isFormFilled && (
          <Button
            variant="ghost"
            size="full"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            나중에 입력할게요
          </Button>
        )}
      </motion.div>
    </div>
  );
}
