"use server";

import { revalidatePath } from "next/cache";
import type { ApiActionResult } from "@/features/shared/domain/types/api-results";
import { projectMemberRepositoryImpl } from "../../infrastructure/repositories/project-member.repository";

/**
 * Server Action para promover un colaborador de READER a EDITOR.
 */
export async function promoteMemberAction(
  projectId: string,
  memberId: string,
): Promise<ApiActionResult> {
  const result = await projectMemberRepositoryImpl.promoteMember(
    projectId,
    memberId,
  );
  if (result.ok) {
    revalidatePath(`/projects/${projectId}`);
  }
  return result;
}

/**
 * Server Action para degradar un colaborador de EDITOR a READER.
 */
export async function demoteMemberAction(
  projectId: string,
  memberId: string,
): Promise<ApiActionResult> {
  const result = await projectMemberRepositoryImpl.demoteMember(
    projectId,
    memberId,
  );
  if (result.ok) {
    revalidatePath(`/projects/${projectId}`);
  }
  return result;
}

/**
 * Server Action para remover a un colaborador del proyecto.
 */
export async function removeMemberAction(
  projectId: string,
  memberId: string,
): Promise<ApiActionResult> {
  const result = await projectMemberRepositoryImpl.removeMember(
    projectId,
    memberId,
  );
  if (result.ok) {
    revalidatePath(`/projects/${projectId}`);
  }
  return result;
}
