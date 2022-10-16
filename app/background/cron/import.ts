import { CronJob } from "cron";
import type { GitlabSettingsType } from "~/models/source/dto/newSource.server";
import { SourceTypeEnum } from "~/models/source/dto/newSource.server";
import { decodeSettings, listSource } from "~/models/source/source.server";
import dayjs from "dayjs";
import { GitlabPlugin } from "~/import";

// TODO generalize the importing creating an abstract class that will be implemented by "plugins"

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
    const cron = new CronJob(`*/10 * * * *`, () => {
      console.debug("running import " + new Date().toISOString());
      this.importFromSource();
    });

    cron.start();
  }

  async importFromSource() {
    const sourceList = await listSource({
      includeContext: true,
      importLatestTask: true,
    });

    // iterate, decode settings and fetch data
    for (const source of sourceList) {
      // from the most recent imported task we can skip the already imported tasks
      const __latestTask = source?.Task?.[0];
      const mostRecentImportedTaskDate = __latestTask
        ? dayjs(__latestTask.createdAt).add(1, "second").toDate()
        : undefined;

      // extra tags to add
      let tagsToAdd = source.defaultTags || "";

      // if context is present add tags from context
      if (source.context) {
        tagsToAdd += source.context.tags;
      }

      console.debug("source.settings", source.settings);
      if (source.type === SourceTypeEnum.Enum.gitlab) {
        const importer = new GitlabPlugin.GitlabImporter();
        const settingsDecoded = decodeSettings<GitlabSettingsType>(source);

        await importer.getAndCreateTasks(source, settingsDecoded, {
          tagsToAdd: tagsToAdd,
          overrideCreatedAfter: mostRecentImportedTaskDate,
        });
      }
    }
  }
}
