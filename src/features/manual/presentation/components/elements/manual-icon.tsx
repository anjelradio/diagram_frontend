import React from "react";
import {
  BookOpen,
  Rocket,
  Boxes,
  Users,
  Bot,
  Cpu,
  FileSpreadsheet,
  SquarePlus,
  Network,
  Share2,
  Mic,
  Image as ImageIcon,
  Download,
  UploadCloud,
  Sparkles,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Terminal,
  Workflow,
  Layers,
  FolderPlus,
  Database,
  Code2,
  type LucideProps,
} from "lucide-react";
import type { ManualIconName } from "@/features/manual/domain/entities/manual-section.entity";

const ICON_MAP: Record<ManualIconName, React.ComponentType<LucideProps>> = {
  BookOpen,
  Rocket,
  Boxes,
  Users,
  Bot,
  Cpu,
  FileSpreadsheet,
  SquarePlus,
  Network,
  Share2,
  Mic,
  Image: ImageIcon,
  Download,
  UploadCloud,
  Sparkles,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Terminal,
  Workflow,
  Layers,
  FolderPlus,
  Database,
  Code2,
};

interface ManualIconProps extends LucideProps {
  name: ManualIconName;
}

export function ManualIcon({ name, ...props }: ManualIconProps) {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent {...props} />;
}
