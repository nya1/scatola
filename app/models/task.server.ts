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
