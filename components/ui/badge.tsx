import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))]",
        secondary:
          "border-transparent bg-[rgb(var(--color-secondary))] text-[rgb(var(--color-secondary-foreground))]",
        outline: "text-[rgb(var(--color-foreground))] border-[rgb(var(--color-border))]",
        accent:
          "border-transparent bg-purple-500/20 text-purple-200",
        success:
          "border-transparent bg-green-500/20 text-green-200",
        destructive:
          "border-transparent bg-red-500/20 text-red-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
