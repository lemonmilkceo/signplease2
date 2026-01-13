import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, User, Mail, Phone, Save, Loader2, UserX, AlertTriangle, Coins, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PaidCreditsInfo {
  contractCredits: number;
  legalReviewCredits: number;
  totalPaidCredits: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const [paidCreditsInfo, setPaidCreditsInfo] = useState<PaidCreditsInfo | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });

  // 비밀번호 변경 상태
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // 유료 크레딧 확인 함수
  const checkPaidCredits = async () => {
    if (!user) return null;

    setIsCheckingCredits(true);
    try {
      // 계약서 생성 크레딧 확인
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('paid_credits')
        .eq('user_id', user.id)
        .single();

      // AI 노무사 법률 검토 크레딧 확인
      const { data: legalCredits } = await supabase
        .from('legal_review_credits')
        .select('paid_reviews')
        .eq('user_id', user.id)
        .single();

      const contractCredits = userCredits?.paid_credits ?? 0;
      const legalReviewCredits = legalCredits?.paid_reviews ?? 0;
      const totalPaidCredits = contractCredits + legalReviewCredits;

      const info = { contractCredits, legalReviewCredits, totalPaidCredits };
      setPaidCreditsInfo(info);
      return info;
    } catch (error) {
      console.error('Error checking credits:', error);
      return { contractCredits: 0, legalReviewCredits: 0, totalPaidCredits: 0 };
    } finally {
      setIsCheckingCredits(false);
    }
  };

  // 탈퇴 버튼 클릭 시
  const handleDeleteClick = async () => {
    const info = await checkPaidCredits();
    if (info && info.totalPaidCredits > 0) {
      setShowRefundDialog(true);
    } else {
      setShowDeleteDialog(true);
    }
  };

  // 실제 탈퇴 처리
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (user) {
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', user.id);
        
        await signOut();
        toast.success('회원 탈퇴가 완료되었습니다');
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('회원 탈퇴에 실패했습니다. 고객센터로 문의해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 비밀번호 변경 처리
  const handleChangePassword = async () => {
    setPasswordError('');

    // 유효성 검사
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('새 비밀번호를 입력해주세요');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('비밀번호가 변경되었습니다');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.message?.includes('same password')) {
        setPasswordError('현재 비밀번호와 동일합니다');
      } else {
        setPasswordError('비밀번호 변경에 실패했습니다');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile?.();
      toast.success('프로필이 저장되었습니다');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">회원정보</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Profile Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">
            {formData.name || '이름 없음'}
          </p>
          <p className="text-sm text-muted-foreground">
            {profile?.role === 'employer' ? '사업주' : '근로자'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              이메일
            </Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              이름
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="이름을 입력하세요"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              연락처
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-0000-0000"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isLoading}
            variant="toss"
            size="lg"
            className="w-full mt-8"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장하기
          </Button>
        </motion.div>

        {/* Password Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8 p-4 rounded-2xl bg-muted/50"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            비밀번호 변경
          </h3>
          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="6자 이상 입력"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="비밀번호를 다시 입력"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              variant="outline"
              className="w-full"
            >
              {isChangingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              비밀번호 변경
            </Button>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-4 rounded-2xl bg-muted/50"
        >
          <h3 className="font-semibold text-foreground mb-3">계정 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">가입일</span>
              <span className="text-foreground">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('ko-KR')
                  : '-'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">회원 유형</span>
              <span className="text-foreground">
                {profile?.role === 'employer' ? '사업주' : '근로자'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-2xl border border-destructive/30 bg-destructive/5"
        >
          <h3 className="font-semibold text-destructive mb-3">위험 구역</h3>
          <p className="text-sm text-muted-foreground mb-4">
            회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
          </p>
          
          <Button 
            variant="outline" 
            className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDeleteClick}
            disabled={isCheckingCredits}
          >
            {isCheckingCredits ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserX className="w-4 h-4 mr-2" />
            )}
            회원 탈퇴
          </Button>
        </motion.div>

        {/* 환불 안내 다이얼로그 (유료 크레딧이 있는 경우) */}
        <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                환불 안내
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>현재 사용하지 않은 유료 크레딧이 남아있습니다.</p>
                  
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                      <Coins className="w-4 h-4" />
                      잔여 유료 크레딧
                    </div>
                    {paidCreditsInfo && paidCreditsInfo.contractCredits > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">계약서 생성 크레딧</span>
                        <span className="font-medium text-foreground">{paidCreditsInfo.contractCredits}개</span>
                      </div>
                    )}
                    {paidCreditsInfo && paidCreditsInfo.legalReviewCredits > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">AI 노무사 검토 크레딧</span>
                        <span className="font-medium text-foreground">{paidCreditsInfo.legalReviewCredits}개</span>
                      </div>
                    )}
                    <div className="border-t border-amber-200 dark:border-amber-800 pt-2 mt-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>총 유료 크레딧</span>
                        <span className="text-amber-600 dark:text-amber-400">{paidCreditsInfo?.totalPaidCredits}개</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm space-y-2">
                    <p className="font-medium text-foreground">환불을 원하시면:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>고객센터로 환불 요청을 해주세요</li>
                      <li>결제 내역 확인 후 환불 처리됩니다</li>
                      <li>환불 완료 후 탈퇴를 진행해주세요</li>
                    </ol>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    * 환불 없이 탈퇴하시면 잔여 크레딧은 소멸됩니다
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel>취소</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundDialog(false);
                  navigate('/support');
                }}
              >
                고객센터로 이동
              </Button>
              <AlertDialogAction
                onClick={() => {
                  setShowRefundDialog(false);
                  setShowDeleteDialog(true);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                환불 없이 탈퇴
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 최종 탈퇴 확인 다이얼로그 */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>회원 탈퇴 시 다음 데이터가 영구적으로 삭제됩니다:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>회원 정보 및 프로필</li>
                    <li>작성한 모든 계약서</li>
                    <li>잔여 크레딧 (환불 불가)</li>
                    <li>채팅 내역</li>
                  </ul>
                  <p className="text-destructive font-medium mt-4">
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '탈퇴하기'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="h-8" />
      </div>
    </div>
  );
}
