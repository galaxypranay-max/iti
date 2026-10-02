import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
  ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-green-600 text-white hover:bg-green-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm sm:text-base",
  lg: "h-12 px-6 text-base sm:text-lg",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:pointer-events-none";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className = "") {
  return base + " " + variants[variant] + " " + sizes[size] + " " + className;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
