import HeaderText from "@/features/auth/presentation/components/elements/header-text";
import { AuthLink } from "@/features/auth/presentation/components/elements/auth-link";
import { FieldDescription } from "@/components/ui/field";
import { ForgotPasswordForm } from "@/features/auth/presentation/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <HeaderText
          title="¿Olvidaste tu contraseña?"
          description="Escribe tu email y te enviaremos un enlace para restablecerla."
        />
        <FieldDescription>
          ¿Recordaste tu contraseña?{" "}
          <AuthLink href="/auth/login" label="Inicia sesión" />
        </FieldDescription>
      </div>
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
