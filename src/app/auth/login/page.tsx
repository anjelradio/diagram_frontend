import { Suspense } from "react";
import { LoginForm } from "@/features/auth/presentation/components/forms/login-form";
import {
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import HeaderText from "@/features/auth/presentation/components/elements/header-text";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";
import { AuthLink } from "@/features/auth/presentation/components/elements/auth-link";
import AuthErrorNotifier from "@/features/auth/presentation/components/elements/auth-error-notifier";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      {/* Lee ?error= en la URL y muestra el toast correspondiente */}
      <Suspense>
        <AuthErrorNotifier />
      </Suspense>
      <div className="flex flex-col items-center gap-2 text-center">
        <HeaderText
          title="Iniciar Sesion"
          description="Introduce tu email y contraseña para acceder."
        />
        <FieldDescription>
          ¿No tienes cuenta? <AuthLink href="/auth/signup" label="Registrate" />
        </FieldDescription>
      </div>
      <div className="w-full max-w-sm">
        <FieldGroup>
          <LoginForm />
          <FieldSeparator>O CONTINUA CON</FieldSeparator>
          <SocialSignInButtons />
        </FieldGroup>
      </div>
    </div>
  );
}
