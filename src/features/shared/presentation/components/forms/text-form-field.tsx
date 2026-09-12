import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TextFormFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "password" | "search";
  autoComplete?: string;
  required?: boolean;
  labelExtra?: ReactNode;
  hint?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  hideLabel?: boolean;
  containerClassName?: string;
} & Omit<ComponentProps<"input">, "type">;

/**
 * Campo de texto base reutilizable para formularios y filtros.
 * Aplica el patrón visual de Stitch con escala amplia para legibilidad,
 * foco luminoso, soporte de icono inicial/final y etiqueta visualmente oculta para accesibilidad.
 */
export function TextFormField({
  id,
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  required = true,
  labelExtra,
  hint,
  leftElement,
  rightElement,
  hideLabel = false,
  containerClassName,
  className,
  ...props
}: TextFormFieldProps) {
  return (
    <div className={cn(!hideLabel && "space-y-2", containerClassName)}>
      {hideLabel ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-[13px] font-medium text-slate-300"
          >
            {label}
          </label>
          {labelExtra}
        </div>
      )}
      <div className="relative flex items-center">
        {leftElement ? (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftElement}
          </div>
        ) : null}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "w-full px-5 py-3 text-sm bg-[#121316] border border-white/10 focus:border-indigo-500/50 text-white placeholder:text-slate-400/90 rounded-full outline-none transition-all duration-200 focus:bg-[#1e1f24] shadow-inner disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:border-destructive",
            leftElement ? "pl-9" : "",
            rightElement ? "pr-12" : "",
            className,
          )}
          {...props}
        />
        {rightElement}
      </div>
      {hint ? (
        <p className="text-xs text-slate-400 px-2 pt-0.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default TextFormField;
