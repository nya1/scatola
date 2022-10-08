import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  return redirect("/tasks");
}

// used to redirect to /tasks endpoint
export default function Index() {
  const _data = useLoaderData();

  return <></>;
}
