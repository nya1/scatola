import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createTask, getAllProjectsUsed, getAllTagsUsed, TaskStatus } from "~/models/task.server";
import { TaskModal } from "~/components/taskModal";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return {
    title: `Create new task | Scatola`,
  };
};

export async function loader() {

  // TODO move get project and tags to client side
  const tagsList = await getAllTagsUsed();
  const projectList = await getAllProjectsUsed();

  return json({ tagsList, projectList });
}

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
    status: TaskStatus.PENDING,
  });

  return redirect("/tasks");
};

export default function NewTask() {
  const data = useLoaderData<typeof loader>();

  return <TaskModal actionType="create" availableTags={data.tagsList} availableProjects={data.projectList} />;
}
