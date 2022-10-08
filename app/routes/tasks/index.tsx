import {
  ActionIcon,
  Button,
  Grid,
  Group,
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
import { marked } from "marked";
import { IconEdit, IconPlus, IconSearch } from "@tabler/icons";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";

export async function loader() {
  const tasks = await listTask();
  return json({ tasks });
}

function CustomBadge({ children }) {
  const themes = useMantineTheme();

  const textVal = children;

  const stringToHslColor = (str, s, l) => {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + (((hash << 5) >>> 0) - hash);
    }

    var h = hash % 360;
    return "hsl(" + h + ", " + s + "%, " + l + "%)";
  };

  let leftText: string | undefined;
  let rightText = textVal;

  if (textVal.includes(":")) {
    // TODO handle multiple :
    const splitChar = textVal.split(":").map((v) => v.replace(/:/g, "").trim());
    leftText = splitChar[0];
    rightText = splitChar[1];
  }

  const bgColor = stringToHslColor(leftText || textVal, 50, 40);

  return (
    <>
      <div
        style={{
          verticalAlign: "middle",
          borderRadius: "32px",
          display: "inline-flex",
          overflow: "hidden",
          color: themes.white,
          fontSize: "13px",
          marginRight: "5px",
          border: `1px solid ${themes.colors.gray[6]}`,
          backgroundColor: leftText
            ? themes.colorScheme === "light"
              ? themes.white
              : themes.colors.gray[9]
            : bgColor,
        }}
      >
        {leftText && (
          <span
            style={{ backgroundColor: bgColor, padding: "0px 5px 0px 9px" }}
          >
            {leftText}
          </span>
        )}
        <span
          style={{
            padding: leftText ? "0px 9px 0px 5px" : "0px 9px",
            color: leftText
              ? themes.colorScheme === "light"
                ? themes.colors.gray[9]
                : themes.white
              : themes.white,
          }}
        >
          {rightText}
        </span>
      </div>
    </>
  );
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

  return (
    <>
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
            render: ({ tags }) => (
              <>
                {tags &&
                  tags.split(",").map((t, i) => {
                    //const bgColor = stringToHslColor(t, 70, 50);
                    //const textColor = "white";
                    return (
                      <CustomBadge key={t + i}>{t}</CustomBadge>
                      // <Badge
                      //   key={t + i}
                      //   styles={{
                      //     inner: { color: textColor },
                      //     root: { backgroundColor: bgColor },
                      //   }}
                      //   mr={5}
                      //   leftSection={<span>test</span>}
                      // >
                      //   {t}
                      // </Badge>
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
              {/* TODO maybe move markdown->html to server? */}
              {/* TODO sanitize html with DOMPurify */}
              {/* TODO add programming language syntax highlight via highlight.js */}
              {record?.description ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked(record.description),
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

        // execute this callback when a row is clicked
        // onRowClick={(row) => alert(`You clicked on ${JSON.stringify(row)}.`)}
      />
    </>
  );
}
