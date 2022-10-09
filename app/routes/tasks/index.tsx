import {
  ActionIcon,
  Button,
  Grid,
  Group,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { listTask } from "~/models/task.server";
import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { DataTable } from "mantine-datatable";
import type { QUnitType } from "dayjs";
import dayjs from "dayjs";
import { IconEdit, IconPlus, IconSearch } from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { CustomBadge } from "~/components/customBadge";
import { safeMarked } from "~/utils";

export async function loader() {
  const tasks = await listTask();
  return json({ tasks });
}

export default function TaskIndexPage() {
  const theme = useMantineTheme();

  const data = useLoaderData<typeof loader>();
  const initialRecords = data.tasks;
  const [records, setRecords] = useState(initialRecords);

  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 200);

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
    // TODO ??
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const toHumanReadableDate = (dueDate?: string | null) => {
    if (dueDate) {
      const diffToCheck = ["month", "day", "hour"];
      // TODO improve typing
      const humanDiffMapping: { [key: string]: string | string[] } = {
        month: "mth", // TODO support mths
        day: "d",
        hour: "hr",
      };
      const dueDateObj = dayjs(dueDate);
      const now = new Date();
      for (const diff of diffToCheck) {
        const diffRes = dueDateObj.diff(now, diff as QUnitType);
        if (diffRes > 0) {
          const humanSuffix = humanDiffMapping[diff];
          dueDate = `${diffRes}${humanSuffix}`;
          break;
        }
      }
    }
    return dueDate;
  };

  const addContext = (e: React.MouseEvent) => {
    e.stopPropagation();

    window.alert("add new context!");
  };

  return (
    <>
      <Stack align="center">
        {/* TODO make default dynamic based on url (checkout mantine) */}
        {/* <Tabs color="teal" defaultValue="all">
          <Tabs.List>
            <Tabs.Tab value="all">
              <Text color={theme.colors.blue[7]}>All</Text>
            </Tabs.Tab>
            <Tabs.Tab value="test" onClickCapture={addContext}>
              <Text color={theme.colors.gray[7]}>+ Add context</Text>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs> */}
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
            to="/tasks/new"
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

      {/* // <Table highlightOnHover>
    //   <thead>
    //     <tr>
    //       <th>Project</th>
    //       <th>Title</th>
    //       <th>Due</th>
    //       <th>Tags</th>
    //     </tr>
    //   </thead>
    //   <tbody>
    //     {data.tasks.map((t, i) => (
    //       <TaskRow task={t} key={i} />
    //     ))}
    //   </tbody>
    // </Table> */}
      <DataTable
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
                  to={"/tasks/edit/" + row.id}
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
                <Text color={theme.colors.gray[7]}>
                  No description,{" "}
                  <Link to={"/tasks/edit/" + record.id}>add it</Link>
                </Text>
              )}
            </div>
          ),
        }}
      />
    </>
  );
}
