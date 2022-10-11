import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  MultiSelect,
  Popover,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { listTask } from "~/models/task.server";
import { Form, Link, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { DataTable } from "mantine-datatable";
import { IconEdit, IconPlus, IconSearch } from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { CustomBadge } from "~/components/customBadge";
import {
  capitalizeFirstLetter,
  safeMarked,
  toHumanReadableDate,
  useTransitionTracking,
} from "~/utils";
import { listContext } from "~/models/context.server";
import dayjs from "dayjs";

type LoaderData = Awaited<ReturnType<typeof getLoaderData>>;

async function getLoaderData(queryParams?: URLSearchParams) {
  const contexts = await listContext();
  console.debug("contexts", contexts);
  const activeContext = queryParams?.get("context");
  console.debug("activeContext", activeContext);

  const rawTags = activeContext
    ? contexts.find((c) => c.name === activeContext)?.tags
    : undefined;
  const tags = rawTags ? rawTags.split(",") : [];
  console.debug("loaded tags", tags);
  const tasks = await listTask({ tags });

  return {
    tasks,
    activeContext,
    contexts,
    tagsOfContext: tags?.join(","),
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);

  return json<LoaderData>(await getLoaderData(url.searchParams));
};

export default function TaskIndexPage() {
  const theme = useMantineTheme();

  const data = useLoaderData<LoaderData>();
  const initialRecords = data.tasks;
  const [records, setRecords] = useState(initialRecords);

  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 200);

  const transition = useTransitionTracking();

  const [popoverOpened, setPopoverOpened] = useState(false);

  // TODO make this based on URL change (context query param)
  // close popover when a new context is created
  useEffect(() => {
    if (popoverOpened && transition.stateChangedTo === "loading") {
      console.debug("context created, closing popover");
      setPopoverOpened(false);
    }
  }, [transition.stateChangedTo, popoverOpened]);

  useEffect(() => {
    setRecords(
      initialRecords.filter((task) => {
        // specific filtering for `project:<dynamic>`
        if (
          debouncedQuery.startsWith("project:") &&
          debouncedQuery.split(":")[1] === task.projectName
        ) {
          return true;
        }

        if (
          debouncedQuery !== "" &&
          !`${task.projectName} ${task.title} ${task.description} ${task.tags} ${task.rawImportedData}`
            .toLowerCase()
            .includes(debouncedQuery.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      })
    );
  }, [debouncedQuery, initialRecords]);

  const NEW_CONTEXT_TAB = "____new-context";

  const [activeTab, __setActiveTab] = useState<string | null>(
    data.activeContext || "all"
  );
  const navigate = useNavigate();

  // on tab change update filters to use
  const setActiveTab = (tabVal: string) => {
    console.debug("setActiveTab", tabVal);
    if (tabVal === NEW_CONTEXT_TAB) {
      return;
    }
    if (tabVal === "all") {
      navigate("/tasks");
      return __setActiveTab(tabVal);
    }

    navigate("/tasks?context=" + tabVal);
    __setActiveTab(tabVal);
  };

  // calculates the new task url to use
  // it must contain all tags to be applied and the context (for later redirect)
  let queryParamsToApply = "";
  if (data.activeContext) {
    queryParamsToApply += `?context=${data.activeContext}`;
  }

  let newTaskUrl = `/tasks/new${queryParamsToApply}`;
  if (
    data.activeContext &&
    data.tagsOfContext &&
    data.tagsOfContext.length > 0
  ) {
    newTaskUrl += `&tags=${data.tagsOfContext}`;
  }

  return (
    <>
      <Stack align="center">
        {/* TODO make default dynamic based on url (checkout mantine) */}
        <Tabs
          color="teal"
          value={activeTab}
          onTabChange={setActiveTab}
          defaultValue="all"
        >
          <Tabs.List>
            <Tabs.Tab value="all">
              <Text color={theme.colors.blue[7]}>All</Text>
            </Tabs.Tab>

            {data.contexts &&
              data.contexts.map((c, i) => {
                return (
                  <Tabs.Tab value={c.name} key={`${c}_${i}`}>
                    <Text>{capitalizeFirstLetter(c.name)}</Text>
                  </Tabs.Tab>
                );
              })}

            <Popover
              opened={popoverOpened}
              width={350}
              position="bottom"
              withArrow
              shadow="md"
            >
              <Popover.Target>
                <Tabs.Tab
                  value={NEW_CONTEXT_TAB}
                  onClick={() => setPopoverOpened((o) => !o)}
                >
                  <Text
                    color={
                      theme.colorScheme === "light"
                        ? theme.colors.gray[7]
                        : theme.colors.gray[4]
                    }
                  >
                    + Add context
                  </Text>
                </Tabs.Tab>
              </Popover.Target>

              <Popover.Dropdown>
                <Box>
                  <Form method="post" action="/tasks/context">
                    <TextInput
                      name="name"
                      label="Context name"
                      description="e.g. home or companyx"
                      pb={8}
                    />

                    <MultiSelect
                      name="tags"
                      label="Tags for this context"
                      description="used as filters in list view and automatically applied on new tasks"
                      data={[]}
                      // value={tags}
                      clearable
                      placeholder="Pick or create one or more tags"
                      searchable
                      creatable
                      getCreateLabel={(query) => `+ add ${query}`}
                      // onCreate={(query) => {
                      //   setTags((current) => [...current, query]);
                      //   return query;
                      // }}
                      pb={14}
                      // defaultValue={preloadedData && preloadedData.length > 0 ? preloadedData : undefined}
                    />

                    <Button
                      fullWidth
                      type="submit"
                      disabled={transition.state === "submitting"}
                    >
                      Add
                    </Button>
                  </Form>
                </Box>
              </Popover.Dropdown>
            </Popover>
          </Tabs.List>
        </Tabs>
        {/* 
        <SegmentedControl
          data={[
            { label: "React", value: "react" },
            { label: "Angular", value: "ng" },
            { label: "Vue", value: "vue" },
            { label: "Svelte", value: "svelte" },
          ]}
        /> */}
      </Stack>

      <Grid justify="center" align="center">
        <Grid.Col span={1}>
          <Button
            mt={2}
            component={Link}
            variant="light"
            leftIcon={<IconPlus size={18} />}
            pr={12}
            ml={6}
            to={newTaskUrl}
          >
            New task
          </Button>
        </Grid.Col>
        <Grid.Col span="auto">
          <TextInput
            placeholder="Search tasks"
            icon={<IconSearch size={16} />}
            ml={3}
            mr={3}
            mt={10}
            mb={7}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </Grid.Col>
      </Grid>

      {/* <div>
          {records.map((t, i) => (
            <div key={"ttt"+i}>{JSON.stringify(t)}</div>
          ))}
      </div> */}

      <DataTable
        minHeight={150}
        emptyState={
          <div>
            <Text>No tasks found</Text>
          </div>
        }
        highlightOnHover
        // provide data
        records={records}
        // define columns
        // TODO improve typing using original Task type
        // TODO add sorting
        columns={[
          { accessor: "projectName" },
          {
            accessor: "scheduled",
            title: "Sched.",
            width: 80,
            render: ({ scheduled }) => toHumanReadableDate(scheduled),
            textAlignment: "center",
          },
          {
            accessor: "due",
            width: 80,
            render: ({ due }) => {
              return (
                <Tooltip label={dayjs(due!).format("ddd D MMM YYYY")}>
                  <span>{toHumanReadableDate(due)}</span>
                </Tooltip>
              );
            },
            textAlignment: "center",
          },
          { accessor: "title", width: "50%" },
          {
            accessor: "tags",
            // this column has custom cell data rendering
            render: ({ id, tags }) => (
              <>
                {tags &&
                  tags.split(",").map((t, i) => {
                    return (
                      <CustomBadge key={`${id}_${t}_${i}`}>{t}</CustomBadge>
                    );
                  })}
              </>
            ),
          },
          {
            accessor: "actions",
            title: "",
            textAlignment: "right",
            render: (row) => (
              <Group position="right" noWrap>
                <ActionIcon
                  onClick={(e) => e.stopPropagation()}
                  component={Link}
                  to={`/tasks/edit/${row.id}${queryParamsToApply}`}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Group>
            ),
          },
        ]}
        rowExpansion={{
          collapseProps: {
            animateOpacity: false,
            transitionDuration: 0,
            transitionTimingFunction: "unset",
          },
          content: ({ record }) => (
            <div style={{ padding: "2px 15px" }}>
              {record?.description ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: safeMarked(record.description),
                  }}
                />
              ) : (
                <Text align="center" color={theme.colors.gray[7]}>
                  No description,{" "}
                  <Link to={`/tasks/edit/${record.id}${queryParamsToApply}`}>
                    add it
                  </Link>
                </Text>
              )}
            </div>
          ),
        }}
      />
    </>
  );
}
