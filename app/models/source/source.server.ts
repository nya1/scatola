import type { Context, Prisma, Source, Task } from "@prisma/client";
import { cryptr } from "~/crypt.server";

import { prisma } from "~/db.server";

export type { Source } from "@prisma/client";

export type SourceWithContext = Prisma.SourceGetPayload<{
  include: { context: true };
}>;

export async function createSource(
  data: Omit<Source, "defaultTags" | "createdAt" | "updatedAt" | "id">
) {
  return prisma.source.create({
    data: {
      ...data,
      // encrypt settings
      settings: cryptr.encrypt(data.settings)
    },
  });
}

export async function listSource(options?: { includeContext?: boolean, importLatestTask?: boolean }): Promise<(Source & {
  context?: Context | null;
  Task?: Task[] | null,
})[]> {
  const args: Prisma.SourceFindManyArgs = {
    include: {
      context: options?.includeContext || false,
      // get the most recent imported task
      Task: options?.importLatestTask ? {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      } : undefined
    }
  };
  const res = await prisma.source.findMany(args);

  // decrypt settings
  return res.map((s) => {
    s.settings = cryptr.decrypt(s.settings);
    return s;
  })
}

export async function getSource(id: string) {
  return prisma.source.findFirst({
    where: {
      id,
    },
  });
}

/**
 * decode settings and set typing
 */
export function decodeSettings<T>(source: Source): T {
  return JSON.parse(source.settings) as T;
}

// export async function listContext(selectTags = true) {
//   return prisma.context.findMany({
//     select: {
//       name: true,
//       tags: selectTags,
//     }
//   });
// }
