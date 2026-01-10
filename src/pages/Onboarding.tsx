import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { FileText, Sparkles, Shield } from "lucide-react";
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

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI가 알아서 작성",
      description: "시급, 시간만 입력하면 끝",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "법적 효력 있는 계약서",
      description: "최신 근로기준법 자동 반영",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "간편한 비대면 서명",
      description: "링크 공유로 바로 서명",
    },
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/70 mb-6 shadow-lg"
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <svg 
              viewBox="0 0 48 48" 
              className="w-14 h-14 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Pen/signature stroke */}
              <path d="M8 36c4-8 12-16 20-20" />
              <path d="M28 16c2 2 4 6 4 10s-2 8-6 12" />
              {/* Checkmark */}
              <path d="M32 28l4 4 8-10" strokeWidth="3" />
              {/* Underline flourish */}
              <path d="M6 40c8 0 16-2 24-4" />
            </svg>
          </motion.div>
          
          <h1 className="text-display text-foreground mb-2">
            싸인해주세요
          </h1>
          <p className="text-body-lg text-muted-foreground">
            30초만에 근로계약서 완성
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="w-full max-w-sm space-y-4 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <div>
                <p className="text-body font-semibold text-foreground">
                  {feature.title}
                </p>
                <p className="text-caption text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Buttons */}
      <motion.div
        className="px-6 pb-8 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          variant="toss"
          size="full"
          onClick={handleGoogleLogin}
          className="gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          구글로 시작하기
        </Button>

        <Button
          variant="toss-outline"
          size="full"
          onClick={handleDemo}
        >
          둘러보기
        </Button>
      </motion.div>
    </div>
  );
}
