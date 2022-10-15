import type { Source } from "@prisma/client";

import { prisma } from "~/db.server";
import { SourceTypeEnum, GitlabSettingsType } from "./dto/newSource.server";

export type { Source } from "@prisma/client";

export async function createSource(
  data: Omit<Source, "defaultTags" | "createdAt" | "updatedAt" | "id">
) {
  return prisma.source.create({
    data,
  });
}

export async function listSource() {
  return prisma.source.findMany();
}

export async function getSource(id: string) {
  return prisma.source.findFirst({
    where: {
      id,
    }
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
