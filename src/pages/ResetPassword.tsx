import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("유효하지 않거나 만료된 링크입니다");
        navigate("/forgot-password");
      }
    };
    checkSession();
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.password) {
      toast.error("새 비밀번호를 입력해주세요");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        toast.error("비밀번호 변경에 실패했습니다: " + error.message);
        return;
      }

      setIsSuccess(true);
      toast.success("비밀번호가 변경되었습니다");
      
      // Sign out to force re-login with new password
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Password update error:", error);
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <h1 className="text-lg font-semibold ml-2">비밀번호 재설정</h1>
        </div>

        {/* Success Message */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold">비밀번호 변경 완료</h2>
            <p className="text-muted-foreground max-w-xs">
              비밀번호가 성공적으로 변경되었습니다.<br />
              새 비밀번호로 로그인해주세요.
            </p>
          </motion.div>

          <div className="mt-8 w-full max-w-sm">
            <Button
              variant="toss"
              size="full"
              onClick={() => navigate("/login")}
              className="h-14 text-base font-semibold"
            >
              로그인하러 가기
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
        <h1 className="text-lg font-semibold">비밀번호 재설정</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 flex flex-col">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Description */}
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              새 비밀번호 설정
            </h2>
            <p className="text-muted-foreground">
              안전한 새 비밀번호를 입력해주세요
            </p>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              새 비밀번호
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="6자 이상 입력"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              비밀번호 확인
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="비밀번호 재입력"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-2">
              <span className={formData.password.length >= 6 ? "text-green-600" : ""}>
                {formData.password.length >= 6 ? "✓" : "•"}
              </span>
              6자 이상
            </p>
            <p className="flex items-center gap-2">
              <span className={formData.password && formData.password === formData.confirmPassword ? "text-green-600" : ""}>
                {formData.password && formData.password === formData.confirmPassword ? "✓" : "•"}
              </span>
              비밀번호 일치
            </p>
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
            {isLoading ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
