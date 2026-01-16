import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const code = searchParams.get("code");
    const message = searchParams.get("message");

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">결제에 실패했습니다</h1>
                <p className="text-muted-foreground mb-2">
                    {message || "알 수 없는 오류가 발생했습니다."}
                </p>
                <p className="text-xs text-muted-foreground mb-8">
                    에러 코드: {code || "UNKNOWN"}
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="toss"
                        size="full"
                        onClick={() => navigate("/pricing")}
                    >
                        다시 시도하기
                    </Button>
                    <Button
                        variant="ghost"
                        size="full"
                        onClick={() => navigate("/employer")}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        대시보드로 이동
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
