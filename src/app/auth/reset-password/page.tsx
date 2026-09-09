import { Suspense } from "react";
import HeaderText from "@/features/auth/presentation/components/elements/header-text";
import { ResetPasswordForm } from "@/features/auth/presentation/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <HeaderText
          title="Nueva contraseña"
          description="Elige una contraseña segura para tu cuenta."
        />
      </div>
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
