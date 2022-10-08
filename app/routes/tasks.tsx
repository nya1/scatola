import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { ImportButtonMenu } from "./tasks/importButton";
import {
  ActionIcon,
  Button,
  Container,
  Grid,
  Group,
  Header,
  Text,
  Code,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { IconBox, IconMoonStars, IconSun } from "@tabler/icons";
// import { CreateManualTicket } from "~/components/createManualTicket";

// export async function loader({ request }: LoaderArgs) {
//   // const userId = await requireUserId(request);
//   // const noteListItems = await getNoteListItems({ userId });
//   return json({ noteListItems: [] });
// }

export default function TasksPage() {
  // const data = useLoaderData<typeof loader>();
  // const user = useUser();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const theme = useMantineTheme();

  const logoColor =
    colorScheme === "light" ? theme.colors.gray[9] : theme.colors.gray[2];

  return (
    <div>
      <Header height={54}>
        <Grid align="center" justify="space-between">
          <Grid.Col span={3}>
            <Group spacing={2}>
              <ActionIcon size="xl">
                <IconBox size={50} color={logoColor} />
              </ActionIcon>
              <Text
                color={logoColor}
                weight={500}
                style={{ fontFamily: theme.fontFamilyMonospace }}
              >
                scatola
              </Text>
            </Group>
          </Grid.Col>
          <Grid.Col span="auto">
            <Group position="right">
              <ImportButtonMenu />
              <ActionIcon
                onClick={() => toggleColorScheme()}
                size="lg"
                sx={(theme) => ({
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.colors.gray[0],
                  color:
                    theme.colorScheme === "dark"
                      ? theme.colors.yellow[4]
                      : theme.colors.blue[6],
                })}
              >
                {colorScheme === "dark" ? (
                  <IconSun size={18} />
                ) : (
                  <IconMoonStars size={18} />
                )}
              </ActionIcon>
            </Group>
          </Grid.Col>
        </Grid>
      </Header>

      <main className="flex h-full bg-white">
        <div className="flex-1 p-6">
          {/* <CreateManualTicket /> */}
          {/* <Link to="/tasks/new">New task</Link>
           */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
