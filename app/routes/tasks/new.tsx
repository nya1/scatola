import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type {
  Task} from "../../models/task.server";
import {
  createTask,
  getAllProjectsUsed,
  getAllTagsUsed,
  TaskStatus,
} from "../../models/task.server";
import { TaskModal } from "../../components/taskModal";
import { useLoaderData } from "@remix-run/react";
import {
  composeRedirectUrlWithContext,
  getContextFromUrl,
  getFormDataFieldsAsObject,
  getQueryParams,
} from "../../utils";

export const meta: MetaFunction = () => {
  return {
    title: `Create new task | Scatola`,
  };
};

type LoaderData = Awaited<ReturnType<typeof getLoaderData>>;

async function getLoaderData(url: string) {
  // TODO move get project and tags to client side
  const tagsList = await getAllTagsUsed();
  const projectList = await getAllProjectsUsed();
  const queryParams = getQueryParams(url);

  // use tags present in query for defaults
  const tagsToPrefill = queryParams.tags;
  const activeContext = queryParams.activeContext;

  return { tagsList, projectList, tagsToPrefill, activeContext };
}

export const loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>(await getLoaderData(request.url));
};

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();

  const fields = getFormDataFieldsAsObject<Task>(
    body,
    ["title", "description", "tags", "due", "projectName", "scheduled"],
    null
  );

  const res = await createTask({
    title: fields.title,
    tags: fields.tags,
    projectName: fields.projectName,
    description: fields.descrtiption,
    due: fields.due ? new Date(fields.due as string) : null,
    scheduled: fields.scheduled ? new Date(fields.scheduled as string) : null,
    status: TaskStatus.PENDING,
    fromSourceId: null,
    webUrl: null,
    rawImportedData: null,
  });

  return redirect(
    composeRedirectUrlWithContext("/tasks", new URL(request.url))
  );
};

export default function NewTask() {
  const data = useLoaderData<LoaderData>();

  return (
    <TaskModal
      actionType="create"
      prefillData={{ tags: data.tagsToPrefill }}
      availableTags={data.tagsList}
      availableProjects={data.projectList}
      activeContext={data.activeContext}
    />
  );
}
