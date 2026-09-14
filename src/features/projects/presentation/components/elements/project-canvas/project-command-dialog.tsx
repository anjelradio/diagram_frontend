"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, Search, X } from "lucide-react";
import type {
  ProjectCanvasCapabilities,
} from "@/features/projects/domain/entities/project.entity";

type ProjectCommandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capabilities?: ProjectCanvasCapabilities;
};

type ShortcutItem = {
  name: string;
  keys: string[];
  category: "Navegación y Lienzo" | "Edición y Modelado (Próximamente)";
};

const SHORTCUTS: ShortcutItem[] = [
  {
    name: "Herramienta Seleccionar / Puntero",
    keys: ["V"],
    category: "Navegación y Lienzo",
  },
  {
    name: "Herramienta Marco de selección",
    keys: ["M"],
    category: "Navegación y Lienzo",
  },
  {
    name: "Mover lienzo (paneo interactivo)",
    keys: ["Espacio", "+", "Arrastrar"],
    category: "Navegación y Lienzo",
  },
  {
    name: "Acercar / Alejar zoom (25% - 200%)",
    keys: ["Ctrl / ⌘", "+", "Rueda"],
    category: "Navegación y Lienzo",
  },
  {
    name: "Alternar menú de atajos",
    keys: ["⌘ / Ctrl", "+", "K"],
    category: "Navegación y Lienzo",
  },
  {
    name: "Nueva clase UML",
    keys: ["C"],
    category: "Edición y Modelado (Próximamente)",
  },
  {
    name: "Conectar relación rápida",
    keys: ["R"],
    category: "Edición y Modelado (Próximamente)",
  },
  {
    name: "Deshacer último cambio",
    keys: ["Ctrl", "+", "Z"],
    category: "Edición y Modelado (Próximamente)",
  },
  {
    name: "Rehacer cambio",
    keys: ["Ctrl", "+", "Y"],
    category: "Edición y Modelado (Próximamente)",
  },
];

/**
 * Diálogo autocontenido de atajos de teclado y comandos del lienzo.
 * Fiel a la especificación de Stitch (SCREEN_6 / ⌘K modal).
 */
export function ProjectCommandDialog({
  open,
  onOpenChange,
  capabilities,
}: ProjectCommandDialogProps) {
  const [query, setQuery] = useState("");
  const canEditDiagram = capabilities ? capabilities.canEditDiagram : true;

  const availableShortcuts = SHORTCUTS.filter((s) => {
    if (!canEditDiagram) {
      if (s.category === "Edición y Modelado (Próximamente)") return false;
      if (s.keys.includes("V") || s.keys.includes("M")) return false;
    }
    return true;
  });

  const filteredShortcuts = availableShortcuts.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.keys.some((k) => k.toLowerCase().includes(query.toLowerCase())) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = Array.from(
    new Set(filteredShortcuts.map((s) => s.category))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[620px] bg-[#1a1b1e] border border-white/10 shadow-2xl rounded-2xl p-0 overflow-hidden text-slate-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner flex-shrink-0">
              <Keyboard className="w-4 h-4" />
            </div>
            <DialogHeader className="p-0 text-left space-y-0.5">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold text-white tracking-tight">
                  Atajos de teclado
                </DialogTitle>
                <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  ⌘K
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-tight">
                Comandos y teclas rápidas para modelar y navegar en el lienzo
              </p>
            </DialogHeader>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95 flex-shrink-0 cursor-pointer"
            title="Cerrar"
            aria-label="Cerrar diálogo de comandos"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campo de búsqueda */}
        <div className="p-4 pb-2 border-b border-white/5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar atajo o comando..."
              className="w-full bg-[#121316] border border-white/10 text-xs text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition placeholder-slate-500"
            />
          </div>
        </div>

        {/* Lista de atajos agrupados */}
        <div className="max-h-[380px] overflow-y-auto p-5 pt-3 flex flex-col space-y-5">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No se encontraron atajos para &quot;{query}&quot;
            </div>
          ) : (
            categories.map((cat) => {
              const items = filteredShortcuts.filter((s) => s.category === cat);
              return (
                <div key={cat} className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {cat}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {items.length} {items.length === 1 ? "acción" : "acciones"}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition"
                      >
                        <span className="text-xs text-slate-300">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {item.keys.map((k, ki) =>
                            k === "+" ? (
                              <span
                                key={ki}
                                className="text-slate-500 text-xs px-0.5"
                              >
                                +
                              </span>
                            ) : (
                              <kbd
                                key={ki}
                                className="px-2 py-0.5 rounded-lg bg-[#121316] border border-white/10 text-[11px] font-mono text-slate-200 shadow-sm"
                              >
                                {k}
                              </kbd>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3.5 px-5 bg-[#121316]/60 border-t border-white/10 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                Esc
              </kbd>{" "}
              para cerrar
            </span>
            <span className="text-slate-600">•</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                ⌘K
              </kbd>{" "}
              para alternar
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Obsidian Flow Studio
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
