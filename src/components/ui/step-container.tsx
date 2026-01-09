import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
  stepKey: string | number;
  className?: string;
}

export function StepContainer({ children, stepKey, className }: StepContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("w-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface StepQuestionProps {
  question: string;
  description?: string;
  className?: string;
}

export function StepQuestion({ question, description, className }: StepQuestionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <motion.h1
        className="text-title text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {question}
      </motion.h1>
      {description && (
        <motion.p
          className="text-body text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
