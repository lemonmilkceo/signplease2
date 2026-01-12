import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { Shield, FileCheck, Lock, CheckCircle2, Users, User } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, isLoading } = useAuth();
  const { setIsDemo } = useAppStore();

  // If already logged in, redirect to role selection
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/select-role");
    }
  }, [user, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleDemo = () => {
    setIsDemo(true);
    navigate("/select-role");
  };

  const trustFeatures = [
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: "법적 효력 보장",
      description: "노동부 표준 양식 기반",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "최신 법률 자동 반영",
      description: "2026년 근로기준법 준수",
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "보안 암호화 저장",
      description: "개인정보 안전하게 보호",
    },
  ];

  const stats = [
    { value: "50,000+", label: "작성된 계약서" },
    { value: "99.9%", label: "서비스 안정성" },
    { value: "4.9", label: "사용자 평점" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-muted border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-12 pb-6 relative z-10">
        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-3 gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center py-4 px-2 rounded-xl bg-muted/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Features */}
        <motion.div
          className="space-y-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {feature.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {feature.description}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            </motion.div>
          ))}
        </motion.div>

        {/* User Trust Indicator */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background flex items-center justify-center"
              >
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">1,200+</span> 사업장이 이용 중
          </p>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="toss"
            size="full"
            onClick={() => navigate("/signup")}
            className="gap-3 h-14 text-base font-semibold shadow-lg"
          >
            <User className="w-5 h-5" />
            회원가입
          </Button>

          <Button
            variant="ghost"
            size="full"
            onClick={handleDemo}
            className="text-muted-foreground h-12"
          >
            먼저 둘러볼게요
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            로그인 시 <span className="underline">이용약관</span> 및{" "}
            <span className="underline">개인정보처리방침</span>에 동의합니다
          </p>
        </motion.div>
      </div>
    </div>
  );
}
