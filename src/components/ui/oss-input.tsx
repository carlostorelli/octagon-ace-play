import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Search, DollarSign, AlertCircle, CheckCircle2, LucideIcon } from "lucide-react";

/* ─── Glove SVG icon (OSS Fantasy brand mark) ─── */
const GloveIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-4 w-4", className)}
  >
    <path d="M6.5 11V7a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v3" />
    <path d="M8.5 10V5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v5" />
    <path d="M10.5 10V4a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v6" />
    <path d="M12.5 10V6a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v4" />
    <path d="M14.5 10a2 2 0 0 1 2 2v1.5a1 1 0 0 1-1 1h0a1 1 0 0 0-1 1V18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2a4 4 0 0 1 .5-2L5 11" />
  </svg>
);

/* ─── Variant definitions ─── */
const inputWrapperVariants = cva(
  "flex items-center gap-2 rounded-lg border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "",
        search: "",
        numeric: "",
      },
      inputSize: {
        sm: "h-9 px-2.5 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
      state: {
        idle: "bg-input-surface border-[hsl(var(--input-border))] hover:border-[hsl(var(--input-border-hover))] focus-within:border-[hsl(var(--input-border-focus))] focus-within:shadow-[var(--input-glow)]",
        error: "bg-input-surface border-destructive/60 focus-within:border-destructive focus-within:shadow-[0_0_12px_hsl(var(--destructive)/0.25)]",
        success: "bg-input-surface border-success/60 focus-within:border-success focus-within:shadow-[0_0_12px_hsl(var(--success)/0.25)]",
        disabled: "bg-muted border-border opacity-60 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
      state: "idle",
    },
  }
);

/* ─── Props ─── */
export interface OSSInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputWrapperVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  prefixIcon?: LucideIcon | "glove";
  suffixIcon?: LucideIcon;
  showBrand?: boolean;
}

/* ─── Component ─── */
const OSSInput = React.forwardRef<HTMLInputElement, OSSInputProps>(
  (
    {
      className,
      variant = "default",
      inputSize = "md",
      state: stateProp,
      label,
      helperText,
      errorMessage,
      successMessage,
      prefixIcon: PrefixIcon,
      suffixIcon: SuffixIcon,
      showBrand,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = !!errorMessage;
    const hasSuccess = !!successMessage && !hasError;
    const computedState = disabled
      ? "disabled"
      : hasError
      ? "error"
      : hasSuccess
      ? "success"
      : stateProp || "idle";

    /* Resolve prefix icon per variant */
    let ResolvedPrefix: LucideIcon | "glove" | undefined = PrefixIcon;
    if (!ResolvedPrefix) {
      if (variant === "search") ResolvedPrefix = Search;
      if (variant === "numeric") ResolvedPrefix = DollarSign;
      if (showBrand) ResolvedPrefix = "glove";
    }

    const renderIcon = (
      IconOrGlove: LucideIcon | "glove" | undefined,
      extraClass?: string
    ) => {
      if (!IconOrGlove) return null;
      if (IconOrGlove === "glove")
        return <GloveIcon className={cn("shrink-0 text-primary", extraClass)} />;
      const Icon = IconOrGlove;
      return <Icon className={cn("h-4 w-4 shrink-0 text-muted-foreground", extraClass)} />;
    };

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-display"
          >
            {label}
          </label>
        )}

        <div
          className={inputWrapperVariants({
            variant,
            inputSize,
            state: computedState as any,
          })}
        >
          {renderIcon(ResolvedPrefix)}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : hasSuccess
                ? `${inputId}-success`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50 text-foreground disabled:cursor-not-allowed font-body"
            {...props}
          />

          {/* State suffix icons */}
          {hasError && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
          {hasSuccess && !hasError && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          )}
          {!hasError && !hasSuccess && renderIcon(SuffixIcon)}
        </div>

        {/* Messages */}
        {hasError && (
          <p id={`${inputId}-error`} className="text-xs text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
        {hasSuccess && (
          <p id={`${inputId}-success`} className="text-xs text-success">
            {successMessage}
          </p>
        )}
        {!hasError && !hasSuccess && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

OSSInput.displayName = "OSSInput";

export { OSSInput, GloveIcon };
