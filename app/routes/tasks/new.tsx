import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  createTask,
  getAllProjectsUsed,
  getAllTagsUsed,
  TaskStatus,
} from "../../models/task.server";
import { TaskModal } from "../../components/taskModal";
import { useLoaderData } from "@remix-run/react";
import { composeRedirectUrlWithContext, getContextFromUrl, getQueryParams } from "../../utils";

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

  return redirect(
    composeRedirectUrlWithContext("/tasks", new URL(request.url))
  );
};

export default function NewTask() {
  const data = useLoaderData<LoaderData>();

  return (
    <TaskModal
      actionType="create"
      prefillData={{tags: data.tagsToPrefill}}
      availableTags={data.tagsList}
      availableProjects={data.projectList}
      activeContext={data.activeContext}
    />
  );
}
