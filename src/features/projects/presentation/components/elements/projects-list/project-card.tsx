import Link from "next/link";
import Image from "next/image";
import type { ProjectListItem } from "../../../../domain/entities/project.entity";

type ProjectCardProps = {
  project: ProjectListItem;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const thumbnailSrc = project.thumbnailUrl || "/images/not_thumbnail.webp";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
    >
      <article className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/35 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7),0_0_15px_-3px_rgba(99,102,241,0.15)] bg-[#17181d] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-sm cursor-pointer">
        {/* Preview Visual con miniatura remota o reserva */}
        <div className="h-44 bg-[#0d0e11] relative overflow-hidden flex items-center justify-center select-none">
          <Image
            src={thumbnailSrc}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#17181d] to-transparent pointer-events-none" />
        </div>

        {/* Contenido de la Card */}
        <div className="p-4 pt-3 flex-1 flex flex-col justify-between -mt-8 relative z-10">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">
                {project.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-light">
              {project.description || "Sin descripción"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Fecha de edición
            </span>
            {!project.isOwner ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                Compartido
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Propietario
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
