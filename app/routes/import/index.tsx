import {
  Text,
  Modal,
  PasswordInput,
  TextInput,
  Box,
  MultiSelect,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { capitalizeFirstLetter, getQueryParams } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  const queryParams = getQueryParams(request.url);
  invariant(typeof queryParams.type === "string", "expected a type");
  console.debug("queryParams", queryParams);
  return json({ ...queryParams });
}

/**
 * modal content dedicated to gitlab import
 */
function GitlabImport() {
  const [usernameList, setUsernameList] = useState<string[]>([]);

  const [projectList, setProjectList] = useState<string[]>([]);

  const stateListAvailable = ["opened", "closed"];
  const [stateList, setStateList] = useState<string[]>(["opened", "closed"]);

  return (
    <Box>
      <Text size="lg" weight="500" mb="xl">Gitlab</Text>

      <Text mb="sm">Security</Text>
      <PasswordInput
        name="personalAccessToken"
        placeholder="Personal access token, e.g. glpat-************"
        label="Personal access token"
        description="Generate via user Preferences-> Access Tokens-> Scope: read_api"
        withAsterisk
      />

      <Text my="sm" mt="xl">Settings</Text>

      <MultiSelect
        pb="sm"
        name="createdByList"
        label="Created by (usernames)"
        data={usernameList}
        description="Only the issues created by these users will be imported"
        searchable
        creatable
        getCreateLabel={(query) => {
          const cleanQuery = query.replace(/@/g, '');
          return `+ Add: ${cleanQuery}`
        }}
        onCreate={(query) => {
          const cleanQuery = query.replace(/@/g, '');
          if (!cleanQuery) {
            return null;
          }
          setUsernameList((curr) => [...curr, cleanQuery]);
          return cleanQuery;
        }}
      />

      <DatePicker
        name="createdAfter"
        description="Import only the issues that were created after this date"
        placeholder="Pick date"
        label="Minimum created date"
        pb="sm"
      />

      <MultiSelect
        pb="sm"
        name="projectLocationList"
        label="Project location list (<username or group>/<project name>)"
        data={projectList}
        description="List of projects included the group or username (e.g. fdroid/fdroidclient)"
        searchable
        creatable
        getCreateLabel={(query) => {
          const querySplit = query?.split("/");

          return querySplit.length === 2 && querySplit[1].length > 0
            ? `+ Create ${query}`
            : "Note: add a / followed by the project name (e.g. dwt1/dotfiles)";
        }}
        onCreate={(query) => {
          if (query.includes("/") === false) {
            return null;
          }
          setProjectList((current) => [...current, query]);
          return query;
        }}
      />

      <MultiSelect
        pb="sm"
        name="stateList"
        label="State list"
        value={stateList}
        data={stateListAvailable}
        description="issues with one of the state selected will be imported"
        onChange={setStateList}
      />
    </Box>
  );
}

export default function ImportTickets() {
  const data = useLoaderData<typeof loader>();

  const [opened, setOpened] = useState(true);

  return (
    <>
      <Modal
        size="xl"
        //centered
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Add new source`}
      >
        {data.type === "gitlab" && <GitlabImport />}
      </Modal>
    </>
  );
}
