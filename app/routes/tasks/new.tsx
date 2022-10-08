import type { ActionFunction, MetaFunction} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createTask } from "~/models/task.server";
import { TaskModal } from "~/components/taskModal";

export const meta: MetaFunction = () => {
  return {
    title: `Create new task | Scatola`,
  };
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();

  const res = await createTask({
    title: body.get("title") as string,
    description: body.get("description") as string,
    tags: body.get("tags") as string,
    due: new Date(body.get("due") as string),
    projectName: body.get("projectName") as string,
    fromSourceId: null,
    webUrl: null,
    scheduled: new Date(body.get("scheduled") as string),
    rawImportedData: null,
  });

  return redirect("/tasks");
};

export default function NewTask() {
  return <TaskModal actionType="create" />;
}
