import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getTask, updateTask } from "~/models/task.server";
import { TaskModal } from "../taskModal";

export async function loader({ request, params }: LoaderArgs) {
  const task = await getTask({ id: params.taskId });
  if (!task) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ task });
}

export const meta: MetaFunction<typeof loader> = ({
  params,
}) => {
  const taskId = params.taskId;
  return {
    title: `Update task ${taskId} | Scatola`,
  };
};

export async function action({ request, params }: ActionArgs) {
  invariant(typeof params.taskId === 'string' || params.taskId, "expected taskId");

  const body = await request.formData();


  await updateTask(
    params.taskId,
    {
      title: body.get("title") as string,
      description: body.get("description") as string,
      tags: body.get("tags") as string,
      due: new Date(body.get("due") as string),
      projectName: body.get("projectName") as string,
      scheduled: new Date(body.get("scheduled") as string),
  })
  
  return redirect("/tasks");
}

export default function EditTaskPage() {
  const data = useLoaderData<typeof loader>();

  return (<TaskModal actionType='update' prefillData={data.task}/>);
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
