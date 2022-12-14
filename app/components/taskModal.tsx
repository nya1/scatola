import {
  Autocomplete,
  Button,
  Center,
  Checkbox,
  Modal,
  MultiSelect,
  Select,
  Textarea,
  TextInput,
  useMantineTheme,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import type { Task } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { useState } from "react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { capitalizeFirstLetter, composeWhitelistedRedirectUrl } from "../utils";

/**
 * task modal, used for creation and update
 */
export function TaskModal(params: {
  actionType: "create" | "update";
  prefillData?: SerializeFrom<Partial<Task>>;
  availableTags?: string[];
  availableProjects?: string[];
  activeContext?: string;
}) {
  const navigate = useNavigate();

  const theme = useMantineTheme();

  const availableProjects = Array.from(
    new Set<string>(params?.availableProjects || [])
  );

  const preloadedData: string[] = params.prefillData?.tags
    ? params.prefillData.tags.split(",")
    : [];
  const availableTags = new Set<string>([
    ...(params?.availableTags || []),
    ...preloadedData,
  ]);

  const [tags, setTags] = useState<string[]>(Array.from(availableTags));
  // console.log('before set tags', params.prefillData);
  // if (typeof params.prefillData?.tags === 'string') {
  //   //const loadedTags = params.prefillData.tags.split(',');
  //   // setTags(["test"]);
  // }

  const todayYearMonthDay = new Date().toISOString().split("T")[0];

  const goBack = () => {
    navigate(
      composeWhitelistedRedirectUrl("/tasks", { context: params.activeContext })
    );
  };

  return (
    <>
      <Modal
        size="xl"
        centered
        opened={true}
        onClose={goBack}
        transitionDuration={0}
        title={
          capitalizeFirstLetter(params.actionType) +
          " task" +
          (params.actionType === "update" ? " " + params.prefillData?.id : "")
        }
      >
        <Form method={params.actionType === "create" ? "post" : "put"} replace>
          <Autocomplete
            name="projectName"
            label="Project"
            placeholder="Type or pick one"
            data={availableProjects}
            limit={5}
            pb={20}
            defaultValue={params.prefillData?.projectName || undefined}
            // data-autofocus
          />

          <TextInput
            name="title"
            label="Title"
            pb={10}
            defaultValue={params.prefillData?.title || undefined}
          />

          <Select
            name="status"
            label="Update to"
            placeholder="status"
            data={["pending", "waiting", "completed", "deleted"]}
            value={params.prefillData?.status || "pending"}
            pb={10}
          />

          <Textarea
            name="description"
            label="Description"
            autosize
            minRows={4}
            pb={14}
            defaultValue={params.prefillData?.description || undefined}
          />

          {/* TODO support comma action to create tag */}
          <MultiSelect
            name="tags"
            label="Tags"
            data={tags}
            // value={tags}
            clearable
            placeholder="Pick or create one or more tags"
            searchable
            creatable
            getCreateLabel={(query) => `+ add ${query}`}
            onCreate={(query) => {
              setTags((current) => [...current, query]);
              return query;
            }}
            pb={14}
            defaultValue={
              preloadedData && preloadedData.length > 0
                ? preloadedData
                : undefined
            }
          />
          {/* TODO accept also time */}
          <DatePicker
            name="scheduled"
            pb={20}
            allowFreeInput
            placeholder="Optional YYYY/MM/DD"
            label="Scheduled date"
            defaultValue={
              params.prefillData?.scheduled
                ? new Date(params.prefillData?.scheduled)
                : undefined
            }
            renderDay={(date) => {
              const inputDateYearMonthDate = date.toISOString().split("T")[0];
              return todayYearMonthDay === inputDateYearMonthDate ? (
                <div
                  style={{
                    // TODO improve border styling for black color scheme
                    border: `2px solid ${
                      theme.colorScheme === "light"
                        ? theme.colors.blue[0]
                        : theme.colors.blue[9]
                    }`,
                    borderRadius: 5,
                  }}
                >
                  {date.getDate()}
                </div>
              ) : (
                <div>{date.getDate()}</div>
              );
            }}
          />

          <DatePicker
            name="due"
            pb={20}
            allowFreeInput
            placeholder="Optional YYYY/MM/DD"
            label="Due date"
            defaultValue={
              params.prefillData?.due
                ? new Date(params.prefillData?.due)
                : undefined
            }
            renderDay={(date) => {
              const inputDateYearMonthDate = date.toISOString().split("T")[0];
              return todayYearMonthDay === inputDateYearMonthDate ? (
                <div
                  style={{
                    // TODO improve border styling for black color scheme
                    border: `2px solid ${
                      theme.colorScheme === "light"
                        ? theme.colors.blue[0]
                        : theme.colors.blue[9]
                    }`,
                    borderRadius: 5,
                  }}
                >
                  {date.getDate()}
                </div>
              ) : (
                <div>{date.getDate()}</div>
              );
            }}
          />

          <Center>
            <Button type="submit">
              {capitalizeFirstLetter(params.actionType)}
            </Button>
          </Center>
        </Form>
      </Modal>
    </>
  );
}
