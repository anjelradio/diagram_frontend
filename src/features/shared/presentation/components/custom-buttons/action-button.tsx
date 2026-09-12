"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ActionButtonVariant = "default" | "destructive" | "ghost";
type ActionButtonSize = "sm" | "md" | "lg";

export type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string;
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  children: ReactNode;
};

const variantStyles: Record<ActionButtonVariant, string> = {
  default:
    "text-slate-400 hover:text-white hover:bg-white/10 active:scale-95",
  destructive:
    "text-slate-400 hover:text-red-400 hover:bg-red-500/15 active:scale-95",
  ghost:
    "text-slate-400 hover:text-slate-200 hover:bg-white/5 active:scale-95",
};

const sizeStyles: Record<ActionButtonSize, string> = {
  sm: "w-6 h-6 rounded-lg text-xs",
  md: "w-7 h-7 rounded-lg text-sm",
  lg: "w-9 h-9 rounded-full text-base",
};

/**
 * Botón iconográfico accesible y reutilizable para acciones rápidas y destructivas.
 */
export function ActionButton({
  ariaLabel,
  variant = "default",
  size = "sm",
  children,
  className,
  disabled,
  title,
  type = "button",
  ...rest
}: ActionButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center transition cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        "disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
