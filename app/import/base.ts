import type { Prisma, Source } from "@prisma/client";
import { __rawUpsertTask } from "../models/task.server";

/**
 * for each plugin extend this class and implement methods
 */
export abstract class ImportBaseClass {
  async getAndCreateTasks(
    source: Source,
    decodedSettings: unknown,
    options?: {
      overrideCreatedAfter?: Date;
      tagsToAdd?: string;
    }
  ): Promise<string[]> {
    throw new Error(`fetchIssues must be implemented`);
  }

  /**
   * create or update task
   */
  protected createNewTask(taskToCreate: Prisma.TaskCreateInput) {
    return __rawUpsertTask(taskToCreate);
  }
}
