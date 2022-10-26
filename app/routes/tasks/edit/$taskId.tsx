import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, ShouldReloadFunction, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import {
  getAllProjectsUsed,
  getAllTagsUsed,
  getTask,
  updateTask,
} from "../../../models/task.server";
import { TaskModal } from "../../../components/taskModal";
import {
  composeRedirectUrlWithContext,
  getContextFromUrl,
  getFormDataFieldsAsObject,
} from "../../../utils";

export async function loader({ request, params }: LoaderArgs) {
  const task = await getTask({ id: params.taskId });
  if (!task) {
    throw new Response("Not Found", { status: 404 });
  }

  // TODO move get project and tags to client side
  const projectList = await getAllProjectsUsed();

  const tagsList = await getAllTagsUsed();

  const activeContext = getContextFromUrl(request.url);

  return json({ task, tagsList, projectList, activeContext });
}

export const meta: MetaFunction<typeof loader> = ({ params }) => {
  const taskId = params.taskId;
  return {
    title: `Update task ${taskId} | Scatola`,
  };
};

export async function action({ request, params }: ActionArgs) {
  invariant(
    typeof params.taskId === "string" || params.taskId,
    "expected taskId"
  );

  const body = await request.formData();

  const fieldsLoaded = getFormDataFieldsAsObject(body, [
    "title",
    "description",
    "tags",
    "due",
    "projectName",
    "scheduled",
    "status",
  ]);
  console.log('fieldsLoaded', fieldsLoaded);

  await updateTask(params.taskId, {
    ...fieldsLoaded,
    due:
      typeof fieldsLoaded?.due === "string"
        ? new Date(fieldsLoaded.due)
        : undefined,
    scheduled:
      typeof fieldsLoaded?.scheduled === "string"
        ? new Date(fieldsLoaded.scheduled)
        : undefined,
  });

  return redirect(
    composeRedirectUrlWithContext("/tasks", request.url)
  );
}

export default function EditTaskPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <TaskModal
      actionType="update"
      prefillData={data.task}
      availableTags={data.tagsList}
      availableProjects={data.projectList}
      activeContext={data.activeContext}
    />
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Task not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
