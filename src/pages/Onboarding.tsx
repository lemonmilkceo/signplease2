import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { Shield, FileCheck, Lock, CheckCircle2, Users, User, Sparkles, Clock, Star } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { setIsDemo } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  // If already logged in, redirect to role selection
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/select-role");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!api) return;

    setCurrentSlide(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  // Auto-play carousel
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [api]);

  const handleDemo = () => {
    setIsDemo(true);
    navigate("/select-role");
  };

  const slides = [
    {
      icon: <FileCheck className="w-10 h-10" />,
      title: "법적 효력이 있는\n근로계약서",
      description: "노동부 표준 양식을 기반으로\n법적 효력이 보장됩니다",
      gradient: "from-blue-500 to-cyan-400",
      bgGradient: "from-blue-500/10 to-cyan-400/10",
    },
    {
      icon: <Clock className="w-10 h-10" />,
      title: "3분 만에 완성되는\n계약서 작성",
      description: "복잡한 절차 없이\n빠르고 쉽게 작성하세요",
      gradient: "from-purple-500 to-pink-400",
      bgGradient: "from-purple-500/10 to-pink-400/10",
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: "2026년 최신 법률\n자동 반영",
      description: "근로기준법 개정사항이\n자동으로 반영됩니다",
      gradient: "from-emerald-500 to-teal-400",
      bgGradient: "from-emerald-500/10 to-teal-400/10",
    },
    {
      icon: <Lock className="w-10 h-10" />,
      title: "안전한 암호화 저장",
      description: "개인정보와 계약서가\n안전하게 보호됩니다",
      gradient: "from-orange-500 to-amber-400",
      bgGradient: "from-orange-500/10 to-amber-400/10",
    },
  ];

  const stats = [
    { value: "50,000+", label: "계약서" },
    { value: "99.9%", label: "안정성" },
    { value: "4.9", label: "평점", icon: <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> },
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
      {/* Header */}
      <motion.div
        className="px-6 pt-8 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">싸인해주세요</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-2">
          간편한 근로계약서
        </h1>
      </motion.div>

      {/* Carousel Section */}
      <motion.div
        className="flex-1 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "center",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-2">
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="pl-2 basis-[85%]">
                <motion.div
                  className={`relative h-[280px] rounded-3xl bg-gradient-to-br ${slide.bgGradient} border border-border/50 p-6 flex flex-col justify-between overflow-hidden`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: currentSlide === index ? 1 : 0.6, 
                    scale: currentSlide === index ? 1 : 0.95 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Background decoration */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${slide.gradient} opacity-20 blur-2xl`} />
                  
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {slide.icon}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-foreground whitespace-pre-line leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                      {slide.description}
                    </p>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === index
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-3 gap-3 px-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center py-3 px-2 rounded-2xl bg-muted/40 border border-border/30"
            >
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                {stat.icon}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* User Trust Indicator */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background flex items-center justify-center"
              >
                <Users className="w-3 h-3 text-primary" />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">1,200+</span> 사업장 이용 중
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom Buttons */}
      <motion.div
        className="px-6 pb-6 pt-4 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          variant="toss"
          size="full"
          onClick={() => navigate("/signup")}
          className="gap-3 h-14 text-base font-semibold shadow-lg"
        >
          <User className="w-5 h-5" />
          시작하기
        </Button>

        <Button
          variant="ghost"
          size="full"
          onClick={handleDemo}
          className="text-muted-foreground h-12"
        >
          먼저 둘러볼게요
        </Button>

        <p className="text-xs text-center text-muted-foreground pt-1">
          가입 시 <span className="underline">이용약관</span> 및{" "}
          <span className="underline">개인정보처리방침</span>에 동의합니다
        </p>
      </motion.div>
    </div>
  );
}
