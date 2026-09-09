import {
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import HeaderText from "@/features/auth/presentation/components/elements/header-text";
import { SignupForm } from "@/features/auth/presentation/components/forms/signup-form";
import { AuthLink } from "@/features/auth/presentation/components/elements/auth-link";
import SocialSignInButtons from "@/features/auth/presentation/components/elements/social-sign-in-buttons";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <HeaderText
          title="Crear cuenta"
          description="Completa tus datos para registrarte."
        />
        <FieldDescription>
          ¿Ya tienes cuenta?{" "}
          <AuthLink href="/auth/login" label="Inicia sesion" />
        </FieldDescription>
      </div>
      <div className="w-full max-w-sm">
        <FieldGroup>
          <SignupForm />
          <FieldSeparator>O CONTINUA CON</FieldSeparator>
          <SocialSignInButtons />
        </FieldGroup>
      </div>
    </div>
  );
}
