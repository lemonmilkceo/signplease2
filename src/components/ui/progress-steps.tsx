import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressSteps({ currentStep, totalSteps, className }: ProgressStepsProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption text-muted-foreground">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
