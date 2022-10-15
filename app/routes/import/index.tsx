import {
  Text,
  Modal,
  PasswordInput,
  Box,
  MultiSelect,
  Button,
  RangeSlider,
  Select,
  SegmentedControl,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { ActionFunction, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { listContext } from "~/models/context.server";
import {
  GitlabSettingsType,
  NewSource,
  NewSourceType,
  SourceImportType,
} from "~/models/source/dto/newSource.server";
import {
  createSource,
  getSource,
  listSource,
} from "~/models/source/source.server";
import {
  capitalizeFirstLetter,
  getFormDataFieldsAsObject,
  getQueryParams,
} from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
  const queryParams = getQueryParams(request.url);
  invariant(typeof queryParams.type === "string", "expected a type");
  console.debug("queryParams", queryParams);

  // TODO move to client side?
  const contextList = await listContext(false);

  // TODO load active context

  return json({ ...queryParams, contextList });
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // const fields = Object.fromEntries(formData.entries()) as NewSourceType;
  const formSettings = getFormDataFieldsAsObject<GitlabSettingsType>(formData, [
    "personalAccessToken",
    "createdAfter",
    "projectLocationList",
    "state",
  ]);
  const type = formData.get("type");
  const defaultContextToUse = formData.get("defaultContextToUse");
  console.debug("type, formSettings", type, formSettings);
  const result = NewSource.safeParse({
    type,
    defaultContextToUse,
    settings: formSettings,
  });
  console.debug("result", result);
  if (!result.success) {
    return json(
      {
        errors: result.error.flatten(),
      },
      {
        status: 400,
      }
    );
  }

  const newSource = await createSource({
    ...result.data,
    importType: SourceImportType.Enum.pull,
    defaultContextToUse: result.data.defaultContextToUse || null,
  });
  console.debug("newSource", newSource);

  const lists = await listSource();
  console.log("LIST SOURCE AFTER", lists);

  return redirect("/tasks");
};

/**
 * modal content dedicated to gitlab import
 */
function GitlabImport() {
  const theme = useMantineTheme();

  const [projectList, setProjectList] = useState<string[]>([]);

  return (
    <Box>
      <input type="hidden" name="type" value="gitlab" />

      <Text mt="sm">Security</Text>
      <PasswordInput
        name="personalAccessToken"
        placeholder="Personal access token, e.g. glpat-************"
        label="Personal access token"
        description="Generate via user Preferences-> Access Tokens-> Scope: read_api"
        withAsterisk
      />

      <Text mt="sm">Settings</Text>

      <MultiSelect
        withAsterisk
        pb="sm"
        name="projectLocationList"
        label="Project location list (<username or group>/<project name>)"
        data={projectList}
        description="List of projects including the group or username (e.g. fdroid/fdroidclient), project wildcard supported"
        searchable
        creatable
        getCreateLabel={(query) => {
          const querySplit = query?.split("/");

          return querySplit.length === 2 && querySplit[1].length > 0
            ? `+ Add: ${query}`
            : "Note: add a / followed by the project name (e.g. dwt1/dotfiles) or wildcard (*)";
        }}
        onCreate={(query) => {
          if (query.includes("/") === false) {
            return null;
          }
          setProjectList((current) => [...current, query]);
          return query;
        }}
      />

      <DatePicker
        name="createdAfter"
        description="Import only the issues that were created after this date"
        placeholder="Pick date"
        label="Minimum created date"
        pb="sm"
        inputFormat="YYYY-MM-DD"
      />

      <Text mt="sm">State</Text>
      <Text size="xs" color={theme.colors.gray[6]}>
        Import only issues with the following state
      </Text>

      <SegmentedControl
        name="state"
        defaultValue="all"
        data={[
          { label: "All", value: "all" },
          { label: "Opened", value: "opened" },
          { label: "Closed", value: "closed" },
        ]}
      />
    </Box>
  );
}

export default function ImportTickets() {
  const data = useLoaderData<typeof loader>();

  const transition = useTransition();

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
        <Form method="post">
          <Text size="lg" weight="500" my="md">
            {capitalizeFirstLetter(data.type!)}
          </Text>

          <Select
            name="defaultContextToUse"
            label="Context"
            description="issues will be imported to the selected context"
            data={data.contextList.map((v) => v.name)}
          />

          {data.type === "gitlab" && <GitlabImport />}

          {/* 
          <Text mt="md" size="sm">
            Refresh rate
          </Text>
          <RangeSlider
            label={(value) => `${value} seconds`}
            labelAlwaysOn
            size={3}
            thumbSize={14}
            min={5}
            max={300}
            mt="sm"
            defaultValue={[60, 90]}
          /> */}

          <Button
            disabled={transition.state === "submitting"}
            mt="lg"
            type="submit"
            fullWidth
          >
            Create
          </Button>
        </Form>
      </Modal>
    </>
  );
}
