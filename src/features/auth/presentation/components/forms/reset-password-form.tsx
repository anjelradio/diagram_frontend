"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className={cn("w-full", className)} {...props}>
      <form ref={formRef} action={handleSubmit} className="space-y-4.5">
        <TextFormField
          id="newPassword"
          name="newPassword"
          label="Nueva contraseña"
          placeholder="Ingresa tu nueva contraseña"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          hint="Mínimo 8 caracteres, incluye letras y números"
          rightElement={
            <button
              type="button"
              aria-label="Mostrar u ocultar contraseña"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </button>
          }
        />

        <TextFormField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          rightElement={
            <button
              type="button"
              aria-label="Mostrar u ocultar contraseña de confirmación"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </button>
          }
        />

        <SubmitButton
          text="Restablecer contraseña"
          pendingText="Restableciendo..."
          className="w-full py-3 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/25 mt-3 border border-indigo-400/30"
        />

        <div className="text-center pt-3.5">
          <Link
            href="/auth/login"
            className="text-[13px] sm:text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200 font-normal"
          >
            Cancelar y volver a iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
