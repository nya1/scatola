import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createContext } from "../../models/context.server";
import invariant from "tiny-invariant";

export const action: ActionFunction = async ({ request }) => {
  const body = await request.formData();

  const name = body.get("name");
  invariant(typeof name === "string" && name, "expected name to be a string");

  const tags = body.get("tags");
  invariant(typeof tags === "string" && tags, "expected tags to be a string");

  await createContext(name, tags);

  return redirect("/tasks?context=" + name);
};

export default function NewContext() {
  return <></>;
}
