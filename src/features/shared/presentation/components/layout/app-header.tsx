"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { clearJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import { appToast } from "../notifications/toast";
import { cn } from "@/lib/utils";

function UserLoader() {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="flex flex-col items-end space-y-1">
        <Skeleton className="h-3.5 w-20 rounded bg-white/10" />
        <Skeleton className="h-3 w-28 rounded bg-white/10" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
    </div>
  );
}

function UserInformation() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (isPending) return <UserLoader />;

  const name = session?.user?.name || "Usuario";
  const email = session?.user?.email;
  const initial = (name[0] ?? "U").toUpperCase();
  const avatarUrl = session?.user?.image;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      clearJWT();
      const { error } = await authClient.signOut();
      if (error) {
        appToast.error(
          "Error al cerrar sesión",
          "No pudimos cerrar tu sesión. Intenta nuevamente.",
        );
        setIsSigningOut(false);
        return;
      }
      setIsOpen(false);
      appToast.info("Cerrando sesión. ¡Hasta luego!");
      router.replace("/auth/login");
    } catch {
      appToast.error("Error al cerrar sesión", "Ocurrió un error inesperado.");
      setIsSigningOut(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Perfil de usuario y opciones de cuenta"
          className="flex items-center gap-3 select-none py-1.5 px-2.5 -mr-2 rounded-2xl hover:bg-white/5 active:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 transition-all cursor-pointer group text-left"
        >
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-medium text-white leading-tight group-hover:text-slate-100 transition-colors">
              {name}
            </span>
            {email ? (
              <span className="text-[11px] font-normal text-slate-400 leading-tight">
                {email}
              </span>
            ) : null}
          </div>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border border-white/10 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
              {initial}
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 p-5 flex flex-col items-center bg-[#18191c] border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl text-slate-200"
      >
        {/* 1. Imagen centrada */}
        <div className="flex justify-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/15 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white uppercase border-2 border-white/15 shadow-md">
              {initial}
            </div>
          )}
        </div>

        {/* 2. Nombre centrado */}
        <h3 className="mt-3 text-sm font-semibold text-white text-center truncate max-w-full leading-snug">
          {name}
        </h3>

        {/* 3. Correo centrado */}
        {email ? (
          <p className="mt-0.5 text-xs text-slate-400 text-center truncate max-w-full">
            {email}
          </p>
        ) : null}

        {/* Separador visual sutil */}
        <div className="w-full my-3.5 border-t border-white/10" />

        {/* 4. Botón Cerrar sesión */}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isSigningOut}
          onClick={handleSignOut}
          className="w-full gap-2 text-xs font-medium rounded-xl cursor-pointer bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 border border-red-500/30 transition-all duration-150"
        >
          {isSigningOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>{isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}</span>
        </Button>
      </PopoverContent>
    </Popover>
  );
}

type AppHeaderProps = {
  children?: ReactNode;
  className?: string;
};

export function AppHeader({ children, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "w-full sticky top-0 z-40 bg-gradient-to-b from-black/80 via-black/35 to-transparent backdrop-blur-[2px]",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/projects"
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <span className="text-lg font-bold tracking-tight text-white">
            Diagram
          </span>
        </Link>

        {children !== undefined ? (
          <div className="flex items-center gap-3 select-none">
            {children}
          </div>
        ) : (
          <UserInformation />
        )}
      </div>
    </header>
  );
}
