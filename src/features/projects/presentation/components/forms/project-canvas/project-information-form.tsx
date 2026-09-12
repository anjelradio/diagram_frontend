"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

type ProjectInformationFormProps = {
  initialName: string;
  initialDescription: string | null;
  onSubmit: (data: { name: string; description: string | null }) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
};

/**
 * Formulario para actualizar el nombre y la descripción de un proyecto.
 * Fiel a las clases y controles del dropdown de Stitch (SCREEN_3).
 */
export function ProjectInformationForm({
  initialName,
  initialDescription,
  onSubmit,
  onCancel,
  isPending,
}: ProjectInformationFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("El nombre del proyecto es obligatorio.");
      return;
    }
    if (trimmedName.length > 255) {
      setNameError("El nombre no puede superar los 255 caracteres.");
      return;
    }
    setNameError(null);

    const trimmedDesc = description.trim();
    await onSubmit({
      name: trimmedName,
      description: trimmedDesc.length > 0 ? trimmedDesc : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Campo de Nombre */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="project-name-input"
          className="text-[11px] font-medium text-slate-300 tracking-tight flex items-center justify-between"
        >
          <span>Nombre del proyecto</span>
          <span className="text-[10px] text-slate-500 font-mono">Obligatorio</span>
        </label>
        <input
          id="project-name-input"
          name="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          disabled={isPending}
          required
          maxLength={255}
          placeholder="Nombre descriptivo del diagrama"
          className="w-full bg-[#121316] border border-white/10 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition placeholder-slate-500 disabled:opacity-50"
        />
        {nameError && (
          <span className="text-red-400 text-[11px]">{nameError}</span>
        )}
      </div>

      {/* Campo de Descripción */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="project-desc-input"
          className="text-[11px] font-medium text-slate-300 tracking-tight"
        >
          Descripción
        </label>
        <textarea
          id="project-desc-input"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          placeholder="Añade notas o alcance del modelo..."
          maxLength={1000}
          className="w-full bg-[#121316] border border-white/10 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition placeholder-slate-500 resize-none disabled:opacity-50"
        />
      </div>

      {/* Acciones del pie */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-1.5 rounded-full text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Guardar cambios</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
