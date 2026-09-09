"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FieldGroup } from "@/components/ui/field";
import TextFormField from "@/features/shared/presentation/components/forms/text-form-field";
import { authClient } from "@/lib/auth-client";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import SubmitButton from "@/features/shared/presentation/components/custom-buttons/submit-button";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/home",
        rememberMe: false,
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
          appToast.success("¡Bienvenido de vuelta!");
          router.push("/home");
        },
        onError: (ctx) => {
          appToast.error(
            "Error al iniciar sesión",
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
          <TextFormField
            id="password"
            name="password"
            label="Contraseña"
            placeholder="*******"
            type="password"
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <SubmitButton
            text="Iniciar sesión"
            pendingText="Iniciando sesión..."
          />
        </FieldGroup>
      </form>
    </div>
  );
}
