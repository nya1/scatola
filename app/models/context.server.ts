import { prisma } from "../db.server";

export type { Context } from "@prisma/client";

export async function createContext(name: string, tags: string) {
  return prisma.context.create({
    data: {
      name,
      tags,
    }
  });
}

export async function listContext(selectTags = true) {
  return prisma.context.findMany({
    select: {
      name: true,
      tags: selectTags,
    }
  });
}
