"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FieldGroup } from "@/components/ui/field";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      appToast.error("Error", "Las contraseñas no coinciden.");
      return;
    }

    /**
     * Better Auth envía el token en la URL como query param ?token=...
     * cuando el usuario hace clic en el enlace del correo.
     */
    const token = searchParams.get("token");

    if (!token) {
      appToast.error(
        "Enlace inválido",
        "El enlace de recuperación no es válido o ha expirado.",
      );
      return;
    }

    await authClient.resetPassword(
      {
        newPassword,
        token,
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success(
            "¡Contraseña actualizada! Ya puedes iniciar sesión.",
          );
          router.push("/auth/login");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al restablecer",
            getAuthErrorMessage(ctx.error.code),
          );
        },
      },
    );
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form ref={formRef} action={handleSubmit}>
        <FieldGroup>
          <TextFormField
            id="newPassword"
            name="newPassword"
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            type="password"
            autoComplete="new-password"
          />
          <TextFormField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            type="password"
            autoComplete="new-password"
          />
          <SubmitButton
            text="Restablecer contraseña"
            pendingText="Restableciendo..."
          />
        </FieldGroup>
      </form>
    </div>
  );
}
