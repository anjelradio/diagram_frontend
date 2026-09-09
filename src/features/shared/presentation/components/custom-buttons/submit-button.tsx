"use client";

import { useFormStatus } from "react-dom";
import { PrimaryButton } from "./primary-button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  text: string;
  pendingText: string;
  className?: string;
  disabled?: boolean;
};

/**
 * SubmitButton — Botón de envío para formularios con el aspecto visual de PrimaryButton.
 * Escucha automáticamente el estado del formulario con useFormStatus y muestra
 * un spinner de carga y el pendingText mientras se procesa la acción.
 */
export function SubmitButton({
  text,
  pendingText,
  className,
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton
      type="submit"
      disabled={disabled || pending}
      className={cn("w-full", className)}
    >
      {pending ? pendingText : text}
      {pending && (
        <Spinner className="ml-2 size-4 text-app-primary-foreground" />
      )}
    </PrimaryButton>
  );
}

export default SubmitButton;
