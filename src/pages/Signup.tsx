import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, User, Calendar, Phone, Mail } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SocialLogin } from "@/components/SocialLogin";
import { popRedirectPath } from "@/lib/deepLink";

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    birthDate: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleChange("phone", formatted);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("이름을 입력해주세요");
      return false;
    }
    if (!formData.gender) {
      toast.error("성별을 선택해주세요");
      return false;
    }
    if (!formData.birthDate) {
      toast.error("생년월일을 입력해주세요");
      return false;
    }
    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
      toast.error("올바른 핸드폰번호를 입력해주세요");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Use phone as email if email is not provided
      const authEmail = formData.email.trim() || `${formData.phone.replace(/\D/g, "")}@alba.local`;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("이미 가입된 사용자입니다");
        } else {
          toast.error("회원가입에 실패했습니다: " + authError.message);
        }
        return;
      }

      if (authData.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            gender: formData.gender,
            birth_date: formData.birthDate,
            phone: formData.phone,
            email: formData.email.trim() || null,
          })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }

        toast.success("회원가입이 완료되었습니다!");

        // Handle deferred deep link
        const redirectPath = popRedirectPath();
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate("/select-role");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("회원가입 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
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
        <h1 className="text-lg font-semibold">회원가입</h1>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 overflow-auto">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="홍길동"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              성별 <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => handleChange("gender", value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="cursor-pointer">남성</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="cursor-pointer">여성</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              생년월일 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
              className="h-12"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              핸드폰번호 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="h-12"
              maxLength={13}
            />
          </div>

          {/* Email (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              이메일 <span className="text-muted-foreground text-xs">(선택)</span>
            </Label>
            <Input
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              비밀번호 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              placeholder="6자 이상 입력"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              비밀번호 확인 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              placeholder="비밀번호 재입력"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className="h-12"
            />
          </div>
        </motion.div>
      </div>

      {/* Bottom Button */}
      <div className="p-6 border-t border-border bg-background">
        <Button
          variant="toss"
          size="full"
          onClick={handleSignup}
          disabled={isLoading}
          className="h-14 text-base font-semibold"
        >
          {isLoading ? "가입 중..." : "가입하기"}
        </Button>

        <div className="mt-4">
          <SocialLogin />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-4">
          가입 시 <span className="underline">이용약관</span> 및{" "}
          <span className="underline">개인정보처리방침</span>에 동의합니다
        </p>
      </div>
    </div>
  );
}
