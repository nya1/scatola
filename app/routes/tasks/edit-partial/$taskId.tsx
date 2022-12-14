import type { Prisma } from "@prisma/client";
import type { ActionArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { updateTask } from "../../../models/task.server";
import { getFormDataFieldsAsObject } from "../../../utils";

export async function action({ request, params }: ActionArgs) {
  invariant(
    typeof params.taskId === "string" || params.taskId,
    "expected taskId"
  );

  const body = await request.formData();

  const fieldsLoaded = getFormDataFieldsAsObject(body, ["status"]);
  console.log("fieldsLoaded", fieldsLoaded);

  const noteList = body
    .getAll("note")
    ?.filter((v) => typeof v === "string" && v) as string[];
  const annotationsToCreate:
    | Prisma.AnnotationUpdateManyWithoutTaskNestedInput
    | undefined =
    noteList && noteList.length > 0
      ? {
          create: noteList.map((c) => {
            return {
              content: c,
            };
          }),
        }
      : undefined;

  await updateTask(params.taskId, {
    ...fieldsLoaded,
    annotations: annotationsToCreate,
  });

  // return json({ success: true });
  return redirect("?");
}

export default function () {
  return <></>;
}
