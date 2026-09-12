"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
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
    <div className={cn("w-full", className)} {...props}>
      <form ref={formRef} action={handleSubmit} className="space-y-4.5">
        <TextFormField
          id="email"
          name="email"
          label="Correo electrónico"
          placeholder="ejemplo@diagram.com"
          type="email"
          autoComplete="email"
          required
        />
        <SubmitButton
          text="Enviar instrucciones de recuperación"
          pendingText="Enviando..."
          className="w-full py-3 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/25 mt-3 border border-indigo-400/30"
        />
      </form>
    </div>
  );
}
