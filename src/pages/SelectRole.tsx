import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { Building2, User } from "lucide-react";
import { toast } from "sonner";

export default function SelectRole() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, isLoading } = useAuth();
  const { isDemo, setUser: setDemoUser } = useAppStore();

  const handleSelectRole = async (role: 'employer' | 'worker') => {
    if (isDemo) {
      // Demo mode - use local state
      setDemoUser({
        id: 'demo-user',
        email: 'demo@sikcon.app',
        name: role === 'employer' ? '김사장님' : '이영희',
        role,
      });
      if (role === 'employer') {
        navigate('/employer');
      } else {
        navigate('/worker');
      }
    } else if (user) {
      // Real user - update profile in database
      try {
        await updateProfile({ role });
        
        if (role === 'employer') {
          navigate('/employer');
        } else {
          // Check if worker already has bank info, if not show onboarding
          if (!profile?.bank_account && !profile?.resident_number) {
            navigate('/worker/onboarding');
          } else {
            navigate('/worker');
          }
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("프로필 업데이트에 실패했습니다.");
        return;
      }
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <motion.div
        className="flex-1 flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {user && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-body text-muted-foreground">
              환영합니다, <span className="text-foreground font-semibold">{profile?.name || user.email}</span>님!
            </p>
          </motion.div>
        )}

        <h1 className="text-title text-foreground mb-2 text-center">
          어떤 용도로 사용하시나요?
        </h1>
        <p className="text-body text-muted-foreground mb-12 text-center">
          사용 목적에 맞는 화면을 보여드릴게요
        </p>

        <div className="w-full max-w-sm space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => handleSelectRole('employer')}
              className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-accent transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-heading font-semibold text-foreground mb-1">
                    사업주
                  </p>
                  <p className="text-caption text-muted-foreground">
                    직원에게 계약서를 보내고 싶어요
                  </p>
                </div>
              </div>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => handleSelectRole('worker')}
              className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-accent transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-heading font-semibold text-foreground mb-1">
                    근로자
                  </p>
                  <p className="text-caption text-muted-foreground">
                    받은 계약서를 확인하고 서명할래요
                  </p>
                </div>
              </div>
            </button>
          </motion.div>
        </div>
      </motion.div>

      {isDemo && (
        <motion.p
          className="text-center text-caption text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          둘러보기 모드입니다. 저장 시 로그인이 필요해요.
        </motion.p>
      )}
    </div>
  );
}
