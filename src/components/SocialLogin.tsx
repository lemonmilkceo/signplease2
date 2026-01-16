import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

export function SocialLogin() {
    const { signInWithGoogle, signInWithKakao } = useAuth();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSocialLogin = async (provider: 'google' | 'kakao') => {
        setIsLoading(provider);
        try {
            if (provider === 'google') await signInWithGoogle();
            if (provider === 'kakao') await signInWithKakao();
        } catch (error: any) {
            console.error(`${provider} login error:`, error);
            toast.error(`${provider} 로그인에 실패했습니다.`);
            setIsLoading(null);
        }
    };

    return null; // Temporarily disabled until business registration
    /*
    return (
        <div className="space-y-3 w-full">
            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">간편 로그인</span>
                </div>
            </div>

            <div className="grid gap-3">
                {/* Kakao Login Button */}
                <Button
                    type="button"
                    onClick={() => handleSocialLogin('kakao')}
                    disabled={!!isLoading}
                    className="h-12 w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] border-none font-medium flex items-center justify-center gap-2"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3C5.13431 3 2 5.34034 2 8.22689C2 10.0933 3.28471 11.7243 5.21667 12.6372L4.39833 15.6323C4.3411 15.8436 4.58882 16.0121 4.75583 15.9015L8.35625 13.5135C8.56708 13.5229 8.78167 13.5276 9 13.5276C12.8657 13.5276 16 11.1873 16 8.30067C16 5.41408 12.8657 3.07379 9 3.07379V3Z" fill="#191919" />
                    </svg>
                    카카오로 시작하기
                </Button>

                {/* Google Login Button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('google')}
                    disabled={!!isLoading}
                    className="h-12 w-full bg-white hover:bg-slate-50 text-slate-900 border-slate-200 font-medium flex items-center justify-center gap-2"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                        <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.551 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.483 0 2.443 2.017.957 4.963l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
                    </svg>
                    Google로 시작하기
                </Button>
            </div>
        </div>
    );
    */
}
