import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  User,
  CreditCard,
  LogOut,
  ChevronRight,
  Coins,
  Mail,
  Phone,
  HelpCircle,
  Shield,
  FileText,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AppDrawerProps {
  userType: 'employer' | 'worker';
}

export function AppDrawer({ userType }: AppDrawerProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

const menuItems = userType === 'employer' 
    ? [
        {
          icon: MessageCircle,
          label: '메시지',
          description: '근로자와 대화하기',
          onClick: () => handleNavigate('/employer/chat'),
        },
        {
          icon: User,
          label: '회원정보',
          description: '내 정보 확인 및 수정',
          onClick: () => handleNavigate('/profile'),
        },
        {
          icon: Coins,
          label: '크레딧 관리',
          description: '잔여 크레딧 및 충전',
          onClick: () => handleNavigate('/pricing'),
        },
        {
          icon: CreditCard,
          label: '결제내역',
          description: '구매 및 결제 내역',
          onClick: () => handleNavigate('/payment-history'),
        },
        {
          icon: FileText,
          label: '이용약관',
          description: '서비스 이용약관',
          onClick: () => handleNavigate('/terms'),
        },
        {
          icon: Shield,
          label: '개인정보처리방침',
          description: '개인정보 보호 정책',
          onClick: () => handleNavigate('/privacy'),
        },
        {
          icon: HelpCircle,
          label: '고객센터',
          description: '문의 및 도움말',
          onClick: () => toast.info('준비 중입니다'),
        },
        {
          icon: LogOut,
          label: '로그아웃',
          description: '계정에서 로그아웃',
          onClick: handleSignOut,
          isLogout: true,
        },
      ]
    : [
        {
          icon: MessageCircle,
          label: '메시지',
          description: '사업주와 대화하기',
          onClick: () => handleNavigate('/worker/chat'),
        },
        {
          icon: User,
          label: '회원정보',
          description: '내 정보 확인 및 수정',
          onClick: () => handleNavigate('/profile'),
        },
        {
          icon: FileText,
          label: '이용약관',
          description: '서비스 이용약관',
          onClick: () => handleNavigate('/terms'),
        },
        {
          icon: Shield,
          label: '개인정보처리방침',
          description: '개인정보 보호 정책',
          onClick: () => handleNavigate('/privacy'),
        },
        {
          icon: HelpCircle,
          label: '고객센터',
          description: '문의 및 도움말',
          onClick: () => toast.info('준비 중입니다'),
        },
        {
          icon: LogOut,
          label: '로그아웃',
          description: '계정에서 로그아웃',
          onClick: handleSignOut,
          isLogout: true,
        },
      ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-4 flex-shrink-0">
          <SheetTitle className="text-left">메뉴</SheetTitle>
        </SheetHeader>

        {/* User Info Section */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {profile?.name || (userType === 'employer' ? '사장님' : '근로자')}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{user?.email || '이메일 없음'}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="flex-shrink-0" />

        {/* Menu Items - Scrollable */}
        <div className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-muted/50 transition-colors text-left ${
                (item as any).isLogout ? 'mt-2' : ''
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                (item as any).isLogout ? 'bg-destructive/10' : 'bg-muted'
              }`}>
                <item.icon className={`w-5 h-5 ${
                  (item as any).isLogout ? 'text-destructive' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${
                  (item as any).isLogout ? 'text-destructive' : 'text-foreground'
                }`}>{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>

        {/* Version - Fixed at bottom */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            싸인해주세요 v1.0.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
