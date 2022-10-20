import { ActionArgs, json, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { updateTask } from "../../../models/task.server";
import { getFormDataFieldsAsObject } from "../../../utils";

export async function action({ request, params }: ActionArgs) {
  invariant(
    typeof params.taskId === "string" || params.taskId,
    "expected taskId"
  );

  const body = await request.formData();

  const fieldsLoaded = getFormDataFieldsAsObject(body, [
    // "note",
    "status",
  ]);
  console.log("fieldsLoaded", fieldsLoaded);

  await updateTask(params.taskId, {
    ...fieldsLoaded,
  });

  // return json({ success: true });
  return redirect("?")
}

export default function() {
  return <></>;
}
