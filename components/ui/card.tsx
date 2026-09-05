import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 transition-all hover:border-slate-700",
        className
      )}
      {...props}
    />
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-blue-900/50 text-blue-300 border-blue-800",
    success: "bg-emerald-900/50 text-emerald-300 border-emerald-800",
    warning: "bg-amber-900/50 text-amber-300 border-amber-800",
    danger: "bg-rose-900/50 text-rose-300 border-rose-800",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-wider transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-md",
    secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700",
    outline: "border border-slate-700 text-slate-200 hover:bg-slate-800",
    ghost: "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
