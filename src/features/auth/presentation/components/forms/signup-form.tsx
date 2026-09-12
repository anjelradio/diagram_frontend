"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: callbackUrl,
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success("¡Registro exitoso! Por favor verifica tu email.");
          router.push("/auth/verify-email");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al registrarse",
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
          id="name"
          name="name"
          label="Nombre completo"
          placeholder="Tu nombre completo"
          type="text"
          autoComplete="name"
          required
        />
        <TextFormField
          id="email"
          name="email"
          label="Correo electrónico"
          placeholder="ejemplo@diagram.com"
          type="email"
          autoComplete="email"
          required
        />
        <TextFormField
          id="password"
          name="password"
          label="Contraseña"
          placeholder="••••••••"
          type="password"
          autoComplete="new-password"
          required
        />
        <SubmitButton
          text="Crear cuenta"
          pendingText="Creando cuenta..."
          className="w-full py-3 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/25 mt-3 border border-indigo-400/30"
        />
      </form>

      <div className="relative my-7 flex items-center gap-3">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-xs text-slate-400 select-none">
          o regístrate con
        </span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      <SocialSignInButtons />
    </div>
  );
}
