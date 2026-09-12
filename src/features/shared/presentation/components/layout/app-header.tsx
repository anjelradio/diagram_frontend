"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
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
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <UserLoader />;

  const name = session?.user?.name || "Usuario";
  const email = session?.user?.email;
  const initial = (name[0] ?? "U").toUpperCase();
  const avatarUrl = session?.user?.image;

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="flex flex-col items-end text-right">
        <span className="text-xs font-medium text-white leading-tight">
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
    </div>
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
