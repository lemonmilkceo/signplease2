import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex w-full rounded-xl border bg-background ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        toss: "border-transparent bg-muted focus-visible:bg-background focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0",
        underline: "border-0 border-b-2 border-input rounded-none bg-transparent focus-visible:border-primary focus-visible:ring-0",
      },
      inputSize: {
        default: "h-12 px-4 py-3 text-body",
        sm: "h-10 px-3 py-2 text-caption",
        lg: "h-14 px-5 py-4 text-body-lg",
        xl: "h-16 px-6 py-5 text-heading",
      },
    },
    defaultVariants: {
      variant: "toss",
      inputSize: "lg",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
