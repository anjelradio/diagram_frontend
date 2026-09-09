"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { FieldGroup } from "@/components/ui/field";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;

    await authClient.requestPasswordReset(
      {
        email,
        /**
         * URL de la página donde el usuario podrá ingresar su nueva contraseña.
         * Better Auth añade automáticamente el ?token=... a esta URL.
         */
        redirectTo: "/auth/reset-password",
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          /**
           * Por seguridad, siempre mostramos el mismo mensaje de éxito
           * independientemente de si el email existe o no en la base de datos.
           * Esto evita que se pueda enumerar usuarios existentes.
           */
          appToast.success(
            "Si ese email está registrado, recibirás un enlace para restablecer tu contraseña.",
          );
        },
        onError: (ctx) => {
          appToast.error(
            "Error al enviar el correo",
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
            id="email"
            name="email"
            label="Email"
            placeholder="tu@correo.com"
            type="email"
            autoComplete="email"
          />
          <SubmitButton text="Enviar enlace" pendingText="Enviando..." />
        </FieldGroup>
      </form>
    </div>
  );
}
