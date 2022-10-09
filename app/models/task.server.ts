import type {
  User,
  Note,
  Task,
  Prisma,
  Source,
  PrismaPromise,
} from "@prisma/client";

import { prisma } from "~/db.server";

// TODO restrict selected fields on fromSource
export type TaskWithSource = Task & {
  fromSource: Source | null;
};
export type { Task } from "@prisma/client";

export enum TaskStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  DELETED = "deleted",
  WAITING = "waiting",
}

/**
 * returns the tags that we have used so far
 * will split tags column
 */
export async function getAllTagsUsed() {
  // TODO order by created at date
  const queryRes = await prisma.$queryRaw<{ tags: string }[]>`
    WITH RECURSIVE split(tags, str) AS (
      SELECT '', tags||',' FROM "Task"
      UNION ALL SELECT
      substr(str, 0, instr(str, ',')),
      substr(str, instr(str, ',')+1)
      FROM split WHERE str!=''
    )
    SELECT DISTINCT tags
    FROM split
    WHERE tags!='';
  `;
  return queryRes.map((v) => v.tags).flat();
}

/**
 * returns all project names used so far
 */
export async function getAllProjectsUsed() {
  // note: prisma orm methods doesn't support a real distinct query,
  // we must write a manual query for performance
  // ref https://github.com/prisma/prisma/issues/14765

  const queryRes = await prisma.$queryRaw<
    { projectName: string }[]
  >`SELECT DISTINCT projectName FROM "Task" WHERE projectName != '' ORDER BY "updatedAt";`;
  return queryRes.map((v) => v.projectName).flat();
}

export function listTask(): PrismaPromise<TaskWithSource[]> {
  return prisma.task.findMany({
    include: {
      fromSource: true,
    },
  });
}

export function getTask(params: Prisma.TaskWhereInput) {
  return prisma.task.findFirst({
    where: params,
  });
}

// export function getNoteListItems({ userId }: { userId: User["id"] }) {
//   return prisma.note.findMany({
//     where: { userId },
//     select: { id: true, title: true },
//     orderBy: { updatedAt: "desc" },
//   });
// }

/*
    context: string | null;
    project: string | null;
    projectUrl: string | null;
    title: string;
    description: string | null;
    due: Date | null;
    tags: string | null;
    createdAt: Date;
    updatedAt: Date;
    fromSourceId
*/

export function createTask(
  params: Omit<Task, "id" | "createdAt" | "updatedAt">
) {
  const taskToCreate: Prisma.TaskCreateInput = params;
  return prisma.task.create({
    data: taskToCreate,
  });
}

export function updateTask(
  id: string,
  params: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
) {
  return prisma.task.update({
    where: {
      id,
    },
    data: params,
  });
}

// export function deleteNote({
//   id,
//   userId,
// }: Pick<Note, "id"> & { userId: User["id"] }) {
//   return prisma.note.deleteMany({
//     where: { id, userId },
//   });
// }
