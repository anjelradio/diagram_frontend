import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerificationPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✉️
          </div>
          <CardTitle className="text-xl">Revisa tu correo electrónico</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de verificación a tu correo electrónico.
            Ábrelo y haz clic en el enlace para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Si no encuentras el correo, revisa tu carpeta de spam o correo no
            deseado. El enlace expirará en unos minutos.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/login">Volver al inicio de sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
