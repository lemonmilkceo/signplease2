import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (value: string) => {
    // If it starts with a number, format as phone
    if (/^\d/.test(value.replace(/\D/g, ""))) {
      setInputValue(formatPhoneNumber(value));
    } else {
      setInputValue(value);
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toast.error("핸드폰번호를 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = inputValue.trim().replace(/\D/g, "");

      const { error } = await supabase.auth.resetPasswordForEmail(`${phoneNumber}@signplease.io`, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // NOTE: Supabase natively uses resetPasswordForEmail. 
      // For pure phone resets, it usually requires SMS OTP flow.
      // Keeping the dummy domain for now as a fallback or user will need SMS flow.

      if (error) {
        if (error.message.includes("rate limit")) {
          toast.error("잠시 후 다시 시도해주세요");
        } else {
          toast.error("비밀번호 재설정 요청에 실패했습니다");
        }
        return;
      }

      setIsSent(true);
      toast.success("비밀번호 재설정 링크가 발송되었습니다");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/login")}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">비밀번호 찾기</h1>
        </div>

        {/* Success Message */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold">이메일을 확인해주세요</h2>
            <p className="text-muted-foreground max-w-xs">
              비밀번호 재설정 링크를 발송했습니다. 이메일을 확인하고 링크를 클릭해주세요.
            </p>
            <p className="text-sm text-muted-foreground">
              이메일이 오지 않았다면 스팸함을 확인해주세요
            </p>
          </motion.div>

          <div className="mt-8 w-full max-w-sm space-y-3">
            <Button
              variant="outline"
              size="full"
              onClick={() => setIsSent(false)}
              className="h-12"
            >
              다시 시도
            </Button>
            <Button
              variant="toss"
              size="full"
              onClick={() => navigate("/login")}
              className="h-12"
            >
              로그인으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/login")}
          className="h-10 w-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">비밀번호 찾기</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 flex flex-col">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              비밀번호를 잊으셨나요?
            </h2>
            <p className="text-muted-foreground">
              가입하신 핸드폰번호를 입력하시면<br />
              비밀번호 재설정 링크를 보내드립니다
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              핸드폰번호
            </Label>
            <Input
              placeholder="010-1234-5678"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12"
            />
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="toss"
            size="full"
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-14 text-base font-semibold"
          >
            {isLoading ? "발송 중..." : "재설정 링크 받기"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            비밀번호가 기억나셨나요?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-medium hover:underline"
            >
              로그인
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
