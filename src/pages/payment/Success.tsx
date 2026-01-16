import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [success, setSuccess] = useState(false);

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    useEffect(() => {
        async function verifyPayment() {
            if (!paymentKey || !orderId || !amount) {
                toast.error("결제 정보가 올바르지 않습니다.");
                setIsVerifying(false);
                return;
            }

            try {
                // In a real app, we would call a Supabase Edge Function to verify with Toss Payments API
                // For this demo, we simulate the verification and credit update
                // const { data, error } = await supabase.functions.invoke('payment-confirm', {
                //   body: { paymentKey, orderId, amount }
                // });

                // Simulating success for now as we don't have the edge function yet
                await new Promise(resolve => setTimeout(resolve, 1500));

                setSuccess(true);
                toast.success("결제가 완료되었습니다! 크레딧이 충전되었습니다.");
            } catch (error) {
                console.error("Payment verification error:", error);
                toast.error("결제 검증에 실패했습니다. 고객센터로 문의해주세요.");
            } finally {
                setIsVerifying(false);
            }
        }

        verifyPayment();
    }, [paymentKey, orderId, amount]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <AnimatePresence mode="wait">
                {isVerifying ? (
                    <motion.div
                        key="verifying"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-foreground mb-2">결제 확인 중</h1>
                        <p className="text-sm text-muted-foreground">잠시만 기다려 주세요...</p>
                    </motion.div>
                ) : success ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">결제 성공!</h1>
                        <p className="text-muted-foreground mb-8">
                            크레딧 충전이 완료되었습니다.<br />
                            이제 AI 근로계약서를 작성해보세요.
                        </p>
                        <Button
                            variant="toss"
                            size="full"
                            onClick={() => navigate("/employer")}
                            className="gap-2"
                        >
                            대시보드로 이동
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <h1 className="text-xl font-bold text-foreground mb-2">결제 처리에 문제가 발생했습니다</h1>
                        <p className="text-muted-foreground mb-8">
                            결제 내역이 확인되지 않습니다. 문제가 지속되면 고객센터로 문의해주세요.
                        </p>
                        <Button variant="outline" onClick={() => navigate("/pricing")}>
                            요금제 페이지로 돌아가기
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
