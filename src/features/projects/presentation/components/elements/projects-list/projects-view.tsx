"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileUp, RefreshCw, Search } from "lucide-react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { TextFormField } from "@/features/shared/presentation/components/forms/text-form-field";
import type {
  ProjectListItem,
  ProjectTab,
} from "../../../../domain/entities/project.entity";
import { projectRepositoryImpl } from "../../../../infrastructure/repositories/project.repository";
import { CreateProjectButton } from "../../forms/projects-list/create-project-button";
import { ProjectCard } from "./project-card";
import { ProjectFilterTabs } from "./project-filter-tabs";

type ProjectsViewProps = {
  projects: ProjectListItem[];
  errorMessage?: string | null;
};

/**
 * Vista principal interactiva para el catálogo de proyectos.
 * Gestiona filtrado local en memoria (pestañas y búsqueda), estados vacío/error
 * y las acciones de creación e importación.
 */
export function ProjectsView({ projects, errorMessage }: ProjectsViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ProjectTab>("owned");
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const ownedCount = useMemo(
    () => projects.filter((p) => p.isOwner).length,
    [projects],
  );

  const sharedCount = useMemo(
    () => projects.filter((p) => !p.isOwner).length,
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const tabItems = projects.filter((p) =>
      activeTab === "owned" ? p.isOwner : !p.isOwner,
    );
    const query = searchTerm.trim().toLowerCase();
    if (!query) return tabItems;

    return tabItems.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(query);
      const descMatch = (p.description ?? "").toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  }, [projects, activeTab, searchTerm]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setIsImporting(true);
    appToast.info("Importando proyecto desde archivo...");

    try {
      const res = await projectRepositoryImpl.importProject(file);
      if (res.ok) {
        appToast.success("Proyecto importado exitosamente");
        router.push(`/projects/${res.data.id}`);
      } else {
        const errorMsg = res.errors?.[0] || "No se pudo importar el proyecto.";
        appToast.error("Error al importar", errorMsg);
      }
    } catch {
      appToast.error("Error", "Error inesperado al importar el archivo.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center">
      {/* Cabecera / Bienvenida */}
      <section
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pt-4"
        data-purpose="hero-header"
      >
        <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
          Te damos la bienvenida&nbsp;
          <div className="font-normal text-white">
            a <span className="font-semibold text-white">DIAgram</span>
          </div>
        </h1>
        <div className="flex flex-row items-center gap-3">
          <CreateProjectButton />
          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 hover:border-indigo-500/40 bg-[#17181d]/80 hover:bg-[#1e1f24] text-slate-200 hover:text-white transition-all duration-200 shadow-sm active:scale-[0.98] text-sm font-medium cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Importa un proyecto desde un archivo XML/XMI compatible con Enterprise Architect"
          >
            <FileUp className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span>{isImporting ? "Importando..." : "Importar Proyecto"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.xmi"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* Controles: Pestañas de filtro y Buscador local */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <ProjectFilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ownedCount={ownedCount}
          sharedCount={sharedCount}
        />
        <TextFormField
          id="project-search"
          name="search"
          label="Buscar proyectos"
          placeholder="Buscar proyectos..."
          type="search"
          hideLabel
          leftElement={<Search className="w-4 h-4 text-slate-400" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="w-full sm:w-64"
          className="w-full sm:w-64 pl-9 py-1.5 text-xs bg-[#17181d]/80 hover:bg-[#1e1f24] focus:bg-[#1e1f24] text-slate-200 placeholder-slate-400 border border-white/10 focus:border-indigo-500/40 rounded-full outline-none transition-all duration-200 shadow-inner pr-4 h-9"
        />
      </div>

      {/* Estado de error */}
      {errorMessage ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[#17181d] border border-red-500/20 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h2 className="text-base font-medium text-white mb-1">
            No se pudieron cargar los proyectos
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : (
        /* Cuadrícula de proyectos o estado vacío */
        <section
          className="w-full"
          id="projects-grid"
          data-purpose="projects-grid"
        >
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[#17181d] border border-white/10 shadow-sm">
              <p className="text-base font-medium text-white mb-1">
                {searchTerm.trim()
                  ? `No se encontraron proyectos para "${searchTerm}"`
                  : activeTab === "owned"
                    ? "Aún no tienes proyectos propios"
                    : "No tienes proyectos compartidos contigo"}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                {searchTerm.trim()
                  ? "Prueba a buscar con otro término o limpia el buscador."
                  : activeTab === "owned"
                    ? "Crea tu primer proyecto para comenzar a modelar tus diagramas."
                    : "Los proyectos que otros miembros compartan contigo aparecerán aquí."}
              </p>
              {searchTerm.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              ) : activeTab === "owned" ? (
                <CreateProjectButton />
              ) : null}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
