"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Box, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type UmlAttribute = {
  id: string;
  name: string;
  type: string;
  visibility: "+" | "-" | "#" | "~";
  isPrimaryKey?: boolean;
};

export type UmlMethod = {
  id: string;
  name: string;
  returnType: string;
  parameters?: string;
  visibility: "+" | "-" | "#" | "~";
};

export type UmlClassNodeData = {
  name: string;
  stereotype?: string;
  attributes: UmlAttribute[];
  methods: UmlMethod[];
};

export type UmlClassNodeType = Node<UmlClassNodeData, "umlClass">;

/**
 * Nodo personalizado de React Flow para modelado de Clases UML.
 * Diseñado con estética Obsidian Studio Canvas: fondo oscuro, acentos de color,
 * tipografía monoespaciada para campos y tipos, y puntos de conexión (handles).
 */
export const UmlClassNode = memo(function UmlClassNode({
  data,
  selected,
}: NodeProps<UmlClassNodeType>) {
  return (
    <div
      className={cn(
        "group relative w-72 sm:w-80 bg-[#17181d]/95 backdrop-blur-md rounded-2xl border transition-all duration-150 select-none shadow-2xl",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/20"
          : "border-white/10 hover:border-white/20 shadow-black/60",
      )}
    >
      {/* Puntos de conexión (Handles) en los 4 extremos */}
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[#17181d] !rounded-full hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[#17181d] !rounded-full hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[#17181d] !rounded-full hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[#17181d] !rounded-full hover:!scale-125 transition-transform"
      />

      {/* Cabecera de la Clase */}
      <div className="bg-gradient-to-r from-indigo-500/15 via-white/[0.02] to-transparent p-3.5 border-b border-white/10 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-sm">
            <Box className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-semibold text-indigo-400 tracking-wider uppercase block leading-none mb-1">
              «{data.stereotype || "class"}»
            </span>
            <h4 className="text-sm font-bold text-white tracking-tight truncate leading-none">
              {data.name}
            </h4>
          </div>
        </div>

        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
          Clase UML
        </span>
      </div>

      {/* Sección de Atributos */}
      <div className="py-2">
        <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
          <span>Atributos</span>
          <span className="text-[9px] font-mono text-slate-500 font-normal">
            ({data.attributes.length})
          </span>
        </div>

        <div className="px-2 space-y-0.5">
          {data.attributes.map((attr) => (
            <div
              key={attr.id}
              className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "font-bold select-none text-xs w-3 text-center flex-shrink-0",
                    attr.visibility === "+" ? "text-emerald-400" : "text-rose-400",
                  )}
                  title={attr.visibility === "+" ? "Público (+)" : "Privado (-)"}
                >
                  {attr.visibility}
                </span>
                <span className="text-slate-200 font-medium truncate">
                  {attr.name}
                </span>
                {attr.isPrimaryKey && (
                  <span
                    title="Clave Primaria"
                    className="inline-flex items-center gap-0.5 text-[9px] font-sans font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1 rounded flex-shrink-0"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    <span>PK</span>
                  </span>
                )}
              </div>
              <span className="text-indigo-400 font-mono text-[11px] flex-shrink-0 ml-3">
                {attr.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-white/10" />

      {/* Sección de Métodos */}
      <div className="py-2">
        <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
          <span>Métodos</span>
          <span className="text-[9px] font-mono text-slate-500 font-normal">
            ({data.methods.length})
          </span>
        </div>

        <div className="px-2 space-y-0.5">
          {data.methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "font-bold select-none text-xs w-3 text-center flex-shrink-0",
                    method.visibility === "+" ? "text-emerald-400" : "text-rose-400",
                  )}
                  title={method.visibility === "+" ? "Público (+)" : "Privado (-)"}
                >
                  {method.visibility}
                </span>
                <span className="text-slate-200 font-medium truncate">
                  {method.name}
                  <span className="text-slate-400 text-[10.5px]">
                    ({method.parameters || ""})
                  </span>
                </span>
              </div>
              <span className="text-indigo-400 font-mono text-[11px] flex-shrink-0 ml-3">
                {method.returnType}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Nodo de prueba por defecto para la clase 'Producto'.
 */
export const defaultProductClassNode: UmlClassNodeType = {
  id: "product-class-test",
  type: "umlClass",
  position: { x: 380, y: 160 },
  data: {
    name: "Producto",
    stereotype: "entity",
    attributes: [
      { id: "a1", visibility: "+", name: "id", type: "UUID", isPrimaryKey: true },
      { id: "a2", visibility: "+", name: "nombre", type: "string" },
      { id: "a3", visibility: "+", name: "precio", type: "Decimal" },
      { id: "a4", visibility: "+", name: "stock", type: "integer" },
      { id: "a5", visibility: "+", name: "descripcion", type: "string" },
      { id: "a6", visibility: "+", name: "activo", type: "boolean" },
    ],
    methods: [
      {
        id: "m1",
        visibility: "+",
        name: "actualizarPrecio",
        parameters: "nuevoPrecio: Decimal",
        returnType: "void",
      },
      {
        id: "m2",
        visibility: "+",
        name: "reducirStock",
        parameters: "cantidad: integer",
        returnType: "boolean",
      },
      {
        id: "m3",
        visibility: "+",
        name: "calcularDescuento",
        parameters: "porcentaje: number",
        returnType: "Decimal",
      },
    ],
  },
};
