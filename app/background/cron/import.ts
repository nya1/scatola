// require("dotenv").config();
import { fetch } from "@remix-run/node";
import { CronJob } from "cron";
import type { GitlabSettingsType } from "~/models/source/dto/newSource.server";
import { SourceTypeEnum } from "~/models/source/dto/newSource.server";
import {
  decodeSettings,
  getSource,
  listSource,
} from "~/models/source/source.server";
import { createTask, Task, __rawCreateTask } from "~/models/task.server";
import { projectMatches } from "~/utils";
import dayjs from "dayjs";
import { Prisma } from "@prisma/client";

// TODO generalize the importing creating an abstract class that will be implemented by "plugins"

const extractProjectName = (str: string) => {
  return str.replace(/#.*$/, "")!.split("/").pop()!;
};

/**
 * allows to import issues from other sources
 * 1. every X minutes
 * 2. load every sources
 * 3. fetch data from every sources
 * 4. create tasks
 */
export class ImportFromSourceCron {
  start() {
    console.debug("import source start");
    // TODO load cronjob rate from env/config
    new CronJob(`*/10 * * * *`, () => {
      console.debug("running import " + new Date().toISOString());
      this.importFromSource();
    });
  }

  async _gitlabApiCall(
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
  async gitlabFetch(settings: GitlabSettingsType) {
    const projectListSettings = settings.projectLocationList.split(",");
    const personalAccessToken = settings.personalAccessToken;

    const baseQueryParams = {
      per_page: 100,
      scope: "all",
      issue_type: "issue",
      created_after: settings.createdAfter,
      state: settings.state,
      // used to mark the issues that we want to import
      // the reaction must be added manually on the issues
      my_reaction_emoji: "link",
    };

    // TODO move me
    const projectListRule = (v: any) => {
      for (const fullProjectSettings of projectListSettings) {
        const namespaceAndProjectToCompare = v.references.full.replace(
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
    };

    const issueList = (
      await this._gitlabApiCall("/issues", baseQueryParams, personalAccessToken)
    ).filter((v: any) => {
      return projectListRule(v);
    });

    return issueList;
  }

  async importFromSource() {
    const sourceList = await listSource();

    const mapGitlabIssueToTask = (
      sourceId: string,
      issue: any
    ): Prisma.TaskCreateInput => {
      return {
        webUrl: issue.web_url,
        title: issue.title,
        description: issue.description,
        due: issue?.due_date ? dayjs(issue.due_date).toDate() : null,
        fromSource: {
          connect: { id: sourceId },
        },
        projectName: extractProjectName(issue.references.full),
        // add to context
        tags: issue.labels.join(","),
        rawImportedData: JSON.stringify(issue),
        status: issue.state === "closed" ? "completed" : "pending",
        scheduled: null,
      };
    };

    // iterate, decode settings and fetch data
    for (const source of sourceList) {
      console.log("source.settings", source.settings);
      if (source.type === SourceTypeEnum.Enum.gitlab) {
        const settingsDecoded = decodeSettings<GitlabSettingsType>(source);

        const gitlabIssues: unknown[] = await this.gitlabFetch(settingsDecoded);
        console.debug("gitlabIssues", gitlabIssues);

        // format gitlab issue into our task
        for (const issue of gitlabIssues) {
          const taskToCreate = mapGitlabIssueToTask(source.id, issue);
          // createMany not available in sqlite, doing manual creation
          // ref https://github.com/prisma/prisma/issues/11507
          const res = await __rawCreateTask(taskToCreate);
          console.debug("created", res);
        }
      }
    }
  }
}
