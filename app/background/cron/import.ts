import { CronJob } from "cron";
import type { GitlabSettingsType } from "../../models/source/dto/newSource.server";
import { SourceTypeEnum } from "../../models/source/dto/newSource.server";
import { decodeSettings, listSource } from "../../models/source/source.server";
import dayjs from "dayjs";
import { GitlabPlugin } from "../../import";

/**
 * allows to import issues from other sources
 * 1. every X minutes
 * 2. load every sources
 * 3. fetch data from every sources
 * 4. create tasks
 */
export class ImportFromSourceCron {
  private cron?: CronJob;

  stop() {
    if (this.cron && this.cron.running) {
      this.cron.stop();
    }
  }

  start() {
    const importCronRate = process.env.SCATOLA_IMPORT_CRON || `*/10 * * * *`;
    // load cronjob rate from env/config

    const cron = new CronJob(importCronRate, () => {
      console.info("running import " + new Date().toISOString());
      this.importFromSource();
    });

    cron.start();

    this.cron = cron;
    console.log(`import cronjob setup done with rate ${importCronRate}`);
  }

  async importFromSource() {
    const sourceList = await listSource({
      includeContext: true,
      importLatestTask: true,
    });

    // iterate, decode settings and fetch data
    for (const source of sourceList) {
      try {
        // from the most recent imported task we can skip the already imported tasks
        const __latestTask = source?.Task?.[0];
        const mostRecentImportedTaskDate = __latestTask
          ? dayjs(__latestTask.createdAt).add(1, "second").toDate()
          : undefined;

        // TODO use a set and convert to string to remove duplicates
        // extra tags to add
        let tagsToAdd = source.defaultTags || "";

        // if context is present add tags from context
        if (source.context) {
          tagsToAdd += source.context.tags;
        }

        if (source.type === SourceTypeEnum.Enum.gitlab) {
          const importer = new GitlabPlugin.GitlabImporter(source);
          const settingsDecoded = decodeSettings<GitlabSettingsType>(source);

          await importer.getAndCreateTasks(source, settingsDecoded, {
            tagsToAdd: tagsToAdd,
            overrideCreatedAfter: mostRecentImportedTaskDate,
          });
        }
      } catch (err) {
        console.error(`failed to process source ${source.id}`, err);
      }
    }
  }
}
