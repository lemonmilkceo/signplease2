import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Copy, Check, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShareContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  workerName: string;
}

export function ShareContractModal({
  open,
  onOpenChange,
  contractId,
  workerName,
}: ShareContractModalProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const contractUrl = `${window.location.origin}/worker/contract/${contractId}`;
  const shareMessage = `[근로계약서 서명 요청]\n\n${workerName}님, 근로계약서가 도착했습니다.\n아래 링크에서 계약 내용을 확인하고 서명해 주세요.\n\n${contractUrl}`;

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const createInvitation = async () => {
    const cleanPhone = phone.replace(/-/g, "");
    
    if (cleanPhone.length < 10) {
      toast({
        title: "연락처 확인",
        description: "올바른 휴대폰 번호를 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Check if worker with this phone exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", cleanPhone)
        .single();

      // Create invitation record
      const { error: inviteError } = await supabase
        .from("contract_invitations")
        .insert({
          contract_id: contractId,
          phone: cleanPhone,
          worker_id: existingProfile?.user_id || null,
          status: existingProfile ? "sent" : "pending",
        });

      if (inviteError) {
        console.error("Invitation error:", inviteError);
        // Continue anyway - sharing is more important
      }

      return true;
    } catch (error) {
      console.error("Error creating invitation:", error);
      return true; // Continue with sharing even if invitation fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoShare = async () => {
    const success = await createInvitation();
    if (!success) return;

    // Use KakaoTalk URL Scheme
    const encodedMessage = encodeURIComponent(shareMessage);
    const kakaoUrl = `kakaolink://send?text=${encodedMessage}`;
    
    // Try to open KakaoTalk
    window.location.href = kakaoUrl;

    // Fallback: After a short delay, if still on page, offer web share
    setTimeout(() => {
      handleWebShareFallback();
    }, 1500);
  };

  const handleWebShareFallback = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "근로계약서 서명 요청",
          text: `${workerName}님, 근로계약서가 도착했습니다.`,
          url: contractUrl,
        });
        toast({
          title: "공유 완료",
          description: "계약서가 공유되었습니다.",
        });
        onOpenChange(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // User cancelled - do nothing
        }
      }
    } else {
      toast({
        title: "카카오톡 공유",
        description: "카카오톡이 열리지 않으면 링크를 복사해서 공유해주세요.",
      });
    }
  };

  const handleWebShare = async () => {
    const success = await createInvitation();
    if (!success) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "근로계약서 서명 요청",
          text: `${workerName}님, 근로계약서가 도착했습니다.`,
          url: contractUrl,
        });
        toast({
          title: "공유 완료",
          description: "계약서가 공유되었습니다.",
        });
        onOpenChange(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    await createInvitation();
    
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      toast({
        title: "복사 완료",
        description: "메시지가 클립보드에 복사되었습니다.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "복사 실패",
        description: "메시지를 복사할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">계약서 공유</DialogTitle>
          <DialogDescription>
            근로자에게 계약서 서명 링크를 공유합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pt-2">
          <div className="space-y-2">
            <Label htmlFor="phone">근로자 연락처</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={13}
            />
            <p className="text-xs text-muted-foreground">
              이미 가입한 근로자라면 바로 서명할 수 있습니다.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-2.5 max-h-24 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-1">공유될 메시지</p>
            <p className="text-xs whitespace-pre-line break-all">{shareMessage}</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col gap-2 pt-3 border-t">
          <Button
            onClick={handleKakaoShare}
            disabled={isLoading || !phone}
            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#191919]"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4 mr-2" />
            )}
            카카오톡으로 공유
          </Button>

          <div className="flex gap-2">
            {typeof navigator !== "undefined" && navigator.share && (
              <Button
                variant="secondary"
                onClick={handleWebShare}
                disabled={isLoading || !phone}
                className="flex-1"
                size="sm"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                다른 앱
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleCopyLink}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1.5" />
              ) : (
                <Copy className="w-4 h-4 mr-1.5" />
              )}
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
