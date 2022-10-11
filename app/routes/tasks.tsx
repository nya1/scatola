import { Outlet } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return {
    title: `Tasks list | Scatola`,
  };
};

export default function TasksPage() {
  return <Outlet />;
}
