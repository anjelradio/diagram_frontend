"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { CircleUser, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { appToast } from "../notifications/toast";
import { useRouter } from "next/navigation";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";

function UserEmailLoader() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-62.5" />
        <Skeleton className="h-4 w-50" />
      </div>
    </div>
  );
}

function UserEmailInformation() {
  const {
    data: session,
    isPending, //loading state
    error, //error object
  } = authClient.useSession();

  if (isPending) return <UserEmailLoader />;

  if (error) {
    appToast.error(
      "Error en la sesion",
      "No hemos encontrado tu sesion actual.",
    );
    return <div>No se encontro una sesion</div>;
  }

  return (
    <div className="flex items-center gap-3">
      <CircleUser className="size-8 text-muted-foreground" />
      <div className="hidden flex-col sm:flex">
        <span className="text-sm font-medium leading-tight">
          {session?.user.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {session?.user.email}
        </span>
      </div>
    </div>
  );
}

export function AppHeader() {
  const router = useRouter();
  const handleSignOut = async () => {
    clearJWT();
    const { error } = await authClient.signOut();
    if (error) {
      appToast.error(
        "Error al cerrar sesion",
        "Tuvimos un error al cerrar tu sesion.",
      );
      return;
    }
    appToast.info("Cerrando sesion. Hasta luego!");
    router.replace("/auth/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/home" className="text-lg font-semibold tracking-tight">
          Tu App
        </Link>

        <div className="flex items-center gap-4">
          {/* User info */}
          <UserEmailInformation />
          <Separator orientation="vertical" className="h-6!" />

          {/* Sign out */}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
