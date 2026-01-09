import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardSlideProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CardSlide({ children, className, onClick }: CardSlideProps) {
  return (
    <motion.div
      className={cn(
        "bg-card rounded-2xl p-6 shadow-card border border-border/50",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.98]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

interface ContractCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  highlight?: boolean;
  className?: string;
}

export function ContractCard({ title, value, icon, highlight, className }: ContractCardProps) {
  return (
    <CardSlide
      className={cn(
        highlight && "border-primary bg-accent",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-caption text-muted-foreground mb-1">{title}</p>
          <p className={cn(
            "text-heading font-semibold",
            highlight ? "text-primary" : "text-foreground"
          )}>
            {value}
          </p>
        </div>
      </div>
    </CardSlide>
  );
}
