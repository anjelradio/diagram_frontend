"use client";

import { Folder, Users } from "lucide-react";
import type { ProjectTab } from "../../../../domain/entities/project.entity";
import { cn } from "@/lib/utils";

type ProjectFilterTabsProps = {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  ownedCount: number;
  sharedCount: number;
};

export function ProjectFilterTabs({
  activeTab,
  onTabChange,
  ownedCount,
  sharedCount,
}: ProjectFilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filtro de proyectos"
      className="inline-flex p-1 rounded-full bg-[#2a2c31] border border-white/10 shadow-inner gap-1 relative"
    >
      <button
        role="tab"
        id="tab-btn-mine"
        aria-selected={activeTab === "owned"}
        aria-controls="projects-grid"
        type="button"
        onClick={() => onTabChange("owned")}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 group cursor-pointer",
          activeTab === "owned"
            ? "text-white bg-[#3e4046] shadow-sm"
            : "text-slate-400 hover:text-white hover:bg-white/5",
        )}
      >
        <Folder
          className={cn(
            "w-3.5 h-3.5 transition-colors",
            activeTab === "owned" ? "text-indigo-400" : "text-slate-400 group-hover:text-white",
          )}
        />
        <span>Mis Proyectos</span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-mono transition-colors duration-200",
            activeTab === "owned"
              ? "bg-white/10 text-indigo-200"
              : "bg-white/5 text-slate-400",
          )}
        >
          {ownedCount}
        </span>
      </button>

      <button
        role="tab"
        id="tab-btn-shared"
        aria-selected={activeTab === "shared"}
        aria-controls="projects-grid"
        type="button"
        onClick={() => onTabChange("shared")}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 group cursor-pointer",
          activeTab === "shared"
            ? "text-white bg-[#3e4046] shadow-sm"
            : "text-slate-400 hover:text-white hover:bg-white/5",
        )}
      >
        <Users
          className={cn(
            "w-3.5 h-3.5 transition-colors",
            activeTab === "shared" ? "text-indigo-400" : "text-slate-400 group-hover:text-white",
          )}
        />
        <span>Compartidos conmigo</span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-mono transition-colors duration-200",
            activeTab === "shared"
              ? "bg-white/10 text-indigo-200"
              : "bg-white/5 text-slate-400",
          )}
        >
          {sharedCount}
        </span>
      </button>
    </div>
  );
}
