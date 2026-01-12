import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRemainingCredits } from "@/lib/credits-api";
import { useNavigate } from "react-router-dom";

interface CreditsBadgeProps {
  showPricingLink?: boolean;
  className?: string;
}

export function CreditsBadge({ showPricingLink = true, className = "" }: CreditsBadgeProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setCredits(5); // Demo mode default
        setIsLoading(false);
        return;
      }

      try {
        const remaining = await getRemainingCredits(user.id);
        setCredits(remaining);
      } catch (error) {
        console.error("Error fetching credits:", error);
        setCredits(5);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  const isLow = credits !== null && credits <= 1;
  const isEmpty = credits === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <div
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
          transition-colors cursor-pointer
          ${isEmpty 
            ? 'bg-destructive/10 text-destructive' 
            : isLow 
              ? 'bg-warning/10 text-warning' 
              : 'bg-primary/10 text-primary'
          }
        `}
        onClick={() => showPricingLink && navigate('/pricing')}
      >
        {isLoading ? (
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <>
            <Coins className="w-4 h-4" />
            <span>{credits}건 남음</span>
          </>
        )}
      </div>
      
      {isEmpty && showPricingLink && (
        <motion.button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          충전하기
        </motion.button>
      )}
    </motion.div>
  );
}
