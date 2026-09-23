"use client";

import React, { useEffect, useState } from "react";
import type { ManualNavItem, ManualSectionId } from "@/features/manual/domain/entities/manual-section.entity";
import { ManualIcon } from "./manual-icon";
import { cn } from "@/lib/utils";

interface ManualNavbarProps {
  items: ManualNavItem[];
}

export function ManualNavbar({ items }: ManualNavbarProps) {
  const [activeId, setActiveId] = useState<ManualSectionId>(items[0]?.id || "introduccion");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", `#${id}`);
      setActiveId(id as ManualSectionId);
    }
  };

  return (
    <nav
      aria-label="Navegación de secciones del manual"
      className="sticky top-16 sm:top-20 z-30 w-full bg-[#121316]/90 backdrop-blur-md border-b border-white/10 shadow-lg"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar scroll-smooth">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 select-none",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40"
                    : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
                )}
              >
                <ManualIcon name={item.iconName} className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-indigo-500/20 text-indigo-300"
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
