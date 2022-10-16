import { z } from "zod";
import type { InferSafeParseErrors } from "../../../utils";
import dayjs from "dayjs";

export const SourceImportType = z.enum(["pull", "webhook", "pullAndWebhook"]);

export const SourceTypeEnum = z.enum(["gitlab"]);

// issue state
const GitlabSettingsStateAvailable = z.enum(["all", "opened", "closed"]);

const GitlabSettings = z.object({
  // for maximum compatibility we are not checking the token prefix
  personalAccessToken: z.string().min(6),
  createdAfter: z
    .string()
    .optional()
    .refine((val) => dayjs(val).isValid(), {
      message: "invalid date provided",
    }),
  // TODO add custom validation of pattern <string>/<string or *>,test/test1
  projectLocationList: z.string().min(1),
  state: GitlabSettingsStateAvailable.optional(),
  // we must convert stringify it, on the database settings is stored as a string (encrypted)
});
export type GitlabSettingsType = z.infer<typeof GitlabSettings>;

export const NewSource = z.object({
  type: SourceTypeEnum,
  defaultContextToUse: z.string().optional(),
  // TODO accept refresh rate (with min, max)
  // refresh: z.object({
  //   min:
  // }),
  // TODO settings should be dynamic based on .type
  settings: GitlabSettings.transform((s) => JSON.stringify(s)), // TODO use a more performant stringfy
});
export type NewSourceType = z.infer<typeof NewSource>;
export type NewSourceErrors = InferSafeParseErrors<typeof NewSource>;
