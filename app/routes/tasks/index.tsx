import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Center,
  Checkbox,
  Grid,
  Group,
  HoverCard,
  Menu,
  MultiSelect,
  Popover,
  SegmentedControl,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { listTask, Task } from "../../models/task.server";
import {
  Form,
  Link,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { DataTable } from "mantine-datatable";
import {
  IconBrandGitlab,
  IconChevronDown,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTool,
  IconTools,
} from "@tabler/icons";
import React, { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { CustomBadge } from "../../components/customBadge";
import {
  safeMarked,
  toHumanReadableDate,
  unpackSearchQuery,
  useTransitionTracking,
} from "../../utils";
import { listContext } from "../../models/context.server";
import dayjs from "dayjs";
import type { SerializeFrom } from "@remix-run/server-runtime";

type LoaderData = Awaited<ReturnType<typeof getLoaderData>>;

async function getLoaderData(queryParams?: URLSearchParams) {
  const contexts = await listContext();
  const activeContext = queryParams?.get("context");

  const rawTags = activeContext
    ? contexts.find((c) => c.name === activeContext)?.tags
    : undefined;
  const tags = rawTags ? rawTags.split(",") : [];
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

  const initialFilterStatus = "pending";

  const __filterByStatus = (statusList: string[]) => {
    return (task: SerializeFrom<Task>) => {
      return statusList.includes(task.status);
    };
  };

  const initialRecords = data.tasks;
  const [records, setRecords] = useState(
    initialRecords.filter(__filterByStatus([initialFilterStatus]))
  );

  const defaultInitialQuery = "";
  const [query, setQuery] = useState(defaultInitialQuery);
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const previousDebounceQuery = useRef(defaultInitialQuery);

  const transition = useTransitionTracking();

  const [popoverOpened, setPopoverOpened] = useState(false);

  // TODO make this based on URL change (context query param)
  // close popover when a new context is created
  useEffect(() => {
    if (popoverOpened && transition.stateChangedTo === "loading") {
      setPopoverOpened(false);
    }
  }, [transition.stateChangedTo, popoverOpened]);

  const triggerFilterByStatus = (statusList: string[]) => {
    setRecords(initialRecords.filter(__filterByStatus(statusList)));
  };

  useEffect(() => {
    // do not run at init
    if (debouncedQuery === previousDebounceQuery.current) {
      return;
    }
    previousDebounceQuery.current = debouncedQuery;
    const unpackedSearchQuery = unpackSearchQuery(debouncedQuery);

    console.debug(
      "search query trigger " + debouncedQuery,
      unpackedSearchQuery
    );

    setRecords(
      initialRecords.filter((task) => {
        // specific filtering for `project:<dynamic>`
        const projectMatch =
          typeof unpackedSearchQuery.dict.project !== "undefined" &&
          unpackedSearchQuery.dict.project === task.projectName;

        // free form text query
        const cleanQuery = unpackedSearchQuery.freeQuery;
        const textSearchMatch =
          cleanQuery !== "" &&
          !!`${task.projectName} ${task.title} ${task.description} ${task.tags} ${task.rawImportedData}`
            .toLowerCase()
            .includes(cleanQuery.trim().toLowerCase());

        return textSearchMatch || projectMatch;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const NEW_CONTEXT_TAB = "____new-context";

  const [activeTab, __setActiveTab] = useState<string | null>(
    data.activeContext || "all"
  );
  const navigate = useNavigate();

  // on tab change update filters to use
  const setActiveTab = (tabVal: string) => {
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
                    <Text>{c.name}</Text>
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
        <Grid.Col span={4}>
          <Checkbox.Group
            onChange={triggerFilterByStatus}
            defaultValue={[initialFilterStatus]}
            spacing="xs"
            mb="xs"
          >
            <Checkbox value="pending" label="Pending" />
            <Checkbox value="waiting" label="Waiting" />
            <Checkbox value="completed" label="Completed" />
            <Checkbox value="deleted" label="Deleted" />
          </Checkbox.Group>
        </Grid.Col>
      </Grid>

      {/* <div>
          {records.map((t, i) => (
            <div key={"ttt"+i}>{JSON.stringify(t)}</div>
          ))}
      </div> */}

      <DataTable
        minHeight={350}
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
          {
            accessor: "projectName",
            render: ({ projectName, webUrl, fromSource }) => {
              if (fromSource) {
                if (fromSource.type === "gitlab") {
                  return (
                    <Anchor href={webUrl!} target="_blank">
                      <Center inline>
                        <IconBrandGitlab size={20} />
                        <Text ml={5}>{projectName}</Text>
                      </Center>
                    </Anchor>
                  );
                  //                   const iconWithText = (
                  //                     <>
                  //                       <Grid.Col>
                  //                         <IconBrandGitlab size={20} />
                  //                       </Grid.Col>
                  //                       <Grid.Col>
                  //                         <span>{projectName}</span>
                  // </Grid.Col>                    </>
                  //                   );
                  //                   return (
                  //                     <Grid>
                  //                       {webUrl ? (
                  //                         <Anchor href={webUrl}>{iconWithText}</Anchor>
                  //                       ) : (
                  //                         iconWithText
                  //                       )}
                  //                     <Grid>
                  //                   );
                }
              }
              return <span>{projectName}</span>;
            },
          },
          {
            accessor: "status",
            title: "Status",
            render: ({ id, status }) => {
              return (
                <HoverCard width={280} shadow="md" withArrow>
                  <HoverCard.Target>
                    <UnstyledButton>
                      <Group spacing={0}>
                        <Text size="sm">{status}</Text>
                        <IconChevronDown size={15} />
                      </Group>
                    </UnstyledButton>
                  </HoverCard.Target>
                  <HoverCard.Dropdown>
                    <Box>
                      <Form
                        method="put"
                        action={`/tasks/edit-partial/${id}`}
                        replace
                      >
                        <Select
                          name="status"
                          label="Update to"
                          placeholder="New status"
                          data={[
                            "pending",
                            "waiting",
                            "completed",
                            "deleted",
                          ].filter((v) => v !== status)}
                          pb="sm"
                        />

                        <Textarea
                          name="note"
                          label="Note"
                          placeholder="Add an optional note"
                          pb="sm"
                        />

                        <Button type="submit" fullWidth>
                          Save
                        </Button>
                      </Form>
                    </Box>
                  </HoverCard.Dropdown>
                </HoverCard>
              );
            },
          },
          {
            accessor: "scheduled",
            title: "Sched.",
            width: 80,
            render: ({ scheduled }) => {
              return (
                <Tooltip label={dayjs(scheduled).format("ddd D MMM YYYY")}>
                  <span>{toHumanReadableDate(scheduled)}</span>
                </Tooltip>
              );
            },
            textAlignment: "center",
          },
          {
            accessor: "due",
            width: 80,
            render: ({ due }) => {
              return (
                <Tooltip label={dayjs(due).format("ddd D MMM YYYY")}>
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
            // transitionTimingFunction: "unset",
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
