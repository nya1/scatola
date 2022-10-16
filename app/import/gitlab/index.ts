import type { Source } from "@prisma/client";
import { ImportBaseClass } from "../base";

import type { Prisma } from "@prisma/client";
import type { GitlabSettingsType } from "~/models/source/dto/newSource.server";
import { SourceTypeEnum } from "~/models/source/dto/newSource.server";
import dayjs from "dayjs";
import { projectMatches } from "~/utils";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

export function getUpstreamRef(type: string, issue: any) {
  return `${type}_${issue.id}`;
}

export function filterIssues(issue: any, projectListSettings: string[]) {
  for (const fullProjectSettings of projectListSettings) {
    const namespaceAndProjectToCompare = issue.references.full.replace(
      /#.*$/,
      ""
    );
    const matchFound = projectMatches(
      fullProjectSettings,
      namespaceAndProjectToCompare
    );
    if (matchFound) {
      return true;
    }
  }
  return false;
}

/**
 * extract plain project name
 * e.g. from `mygroup/project#32` returns `project`
 */
export function extractProjectName(str: string): string {
  return str.replace(/#.*$/, "")!.split("/").pop()!;
}

export function mapGitlabIssueToTask(
  sourceId: string,
  issue: any,
  tags?: string
): Prisma.TaskCreateInput {
  return {
    id: getUpstreamRef(SourceTypeEnum.Enum.gitlab, issue),
    webUrl: issue.web_url,
    title: issue.title,
    description: issue.description,
    due: issue?.due_date ? dayjs(issue.due_date).toDate() : null,
    fromSource: {
      connect: { id: sourceId },
    },
    projectName: extractProjectName(issue.references.full),
    tags:
      tags + (issue.labels ? (tags ? "," : "") + issue.labels.join(",") : ""),
    rawImportedData: JSON.stringify(issue),
    status: issue.state === "closed" ? "completed" : "pending",
    scheduled: null,
  };
}

export class GitlabImporter extends ImportBaseClass {
  private async _gitlabApiCall(
    path: string,
    queryParams: { [key: string]: unknown },
    token: string
  ) {
    const url = new URL(`https://gitlab.com/api/v4${path}`);
    // add query params
    for (const key of Object.keys(queryParams)) {
      const value = queryParams[key];
      if (typeof value === "undefined") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
    console.debug(url);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const jsonRes = await res.json();
    console.debug("res", jsonRes);
    return jsonRes;
  }

  /**
   * returns issues with "link" emoji reaction
   *
   * TODO search issues via project based fetching instead of manual reaction
   *   - list projects https://gitlab.com/api/v4/projects?min_access_level=10&simple=true&per_page=100&with_issues_enabled=true
   *   - list issues of each project https://docs.gitlab.com/ee/api/issues.html#list-project-issues
   * ref https://docs.gitlab.com/ee/api/issues.html#list-issues
   */
  async getAndCreateTasks(
    source: Source,
    settings: GitlabSettingsType,
    options?: { overrideCreatedAfter?: Date | undefined; tagsToAdd?: string }
  ) {
    const projectListSettings = settings.projectLocationList.split(",");
    const personalAccessToken = settings.personalAccessToken;

    const createdAfter =
      options?.overrideCreatedAfter ||
      (settings.createdAfter ? new Date(settings.createdAfter) : undefined);

    const baseQueryParams = {
      per_page: 100,
      scope: "all",
      issue_type: "issue",
      created_after: createdAfter ? createdAfter.toISOString() : undefined,
      state: settings.state,
      // used to mark the issues that we want to import
      // the reaction must be added manually on the issues
      my_reaction_emoji: "link",
    };
    console.debug("baseQueryParams", baseQueryParams);

    // TODO handle pagination
    const issueList = (
      await this._gitlabApiCall("/issues", baseQueryParams, personalAccessToken)
    ).filter((v: any) => {
      return filterIssues(v, projectListSettings);
    });

    // from gitlab issue to task
    // format gitlab issue into our task
    const taskIdsCreated: string[] = [];
    for (const issue of issueList) {
      const taskToCreate = mapGitlabIssueToTask(
        source.id,
        issue,
        options?.tagsToAdd
      );
      try {
        await this.createNewTask(taskToCreate);
      } catch (err) {
        if (
          err instanceof PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          console.log(`skipping already imported task id ${taskToCreate?.id}`);
          continue;
        } else {
          console.error(err);
          throw err;
        }
      }
      taskIdsCreated.push(taskToCreate.id!);
    }

    return taskIdsCreated;
  }
}
