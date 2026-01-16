import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { SocialLogin } from "@/components/SocialLogin";
import { popRedirectPath } from "@/lib/deepLink";

const REMEMBER_ME_KEY = "signplease_remember_me";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) === "true";
  });
  const [formData, setFormData] = useState({
    phoneOrEmail: "",
    password: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneOrEmailChange = (value: string) => {
    // If it starts with a number, format as phone
    if (/^\d/.test(value.replace(/\D/g, ""))) {
      handleChange("phoneOrEmail", formatPhoneNumber(value));
    } else {
      handleChange("phoneOrEmail", value);
    }
  };

  const validateForm = () => {
    if (!formData.phoneOrEmail.trim()) {
      toast.error("핸드폰번호 또는 이메일을 입력해주세요");
      return false;
    }
    if (!formData.password) {
      toast.error("비밀번호를 입력해주세요");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Determine if input is email or phone
      const input = formData.phoneOrEmail.trim();
      const isEmail = input.includes("@");

      let email = input;
      if (!isEmail) {
        // Convert phone to email format
        const phoneNumbers = input.replace(/\D/g, "");
        email = `${phoneNumbers}@signplease.io`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("로그인 정보가 올바르지 않습니다");
        } else {
          toast.error(`로그인에 실패했습니다: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        // Save remember me preference
        localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());

        toast.success("로그인되었습니다!");

        // Handle deferred deep link
        const redirectPath = popRedirectPath();
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate("/select-role");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear session on browser close if remember me is disabled
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!rememberMe && localStorage.getItem(REMEMBER_ME_KEY) !== "true") {
        supabase.auth.signOut();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [rememberMe]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/onboarding")}
          className="h-10 w-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">로그인</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 flex flex-col">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Welcome Text */}
          <div className="text-center py-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              다시 만나서 반가워요!
            </h2>
            <p className="text-muted-foreground">
              계정에 로그인해주세요
            </p>
          </div>

          {/* Phone or Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              핸드폰번호 또는 이메일
            </Label>
            <Input
              placeholder="010-1234-5678 또는 example@email.com"
              value={formData.phoneOrEmail}
              onChange={(e) => handlePhoneOrEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              비밀번호
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 입력"
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                로그인 유지
              </label>
            </div>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-primary hover:underline"
            >
              비밀번호를 잊으셨나요?
            </button>
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
            onClick={handleLogin}
            disabled={isLoading}
            className="h-14 text-base font-semibold"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>

          <SocialLogin />

          <p className="text-center text-sm text-muted-foreground mt-4">
            계정이 없으신가요?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-primary font-medium hover:underline"
            >
              회원가입
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
