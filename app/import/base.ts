import type { Prisma, Source } from "@prisma/client";
import { __rawCreateTask } from "~/models/task.server";

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
    console.debug(
      `ImportBaseClass.fetchIssues`,
      source,
      decodedSettings,
      options
    );

    throw new Error(`fetchIssues must be implemented`);
  }

  protected createNewTask(taskToCreate: Prisma.TaskCreateInput) {
    return __rawCreateTask(taskToCreate);
  }
}
