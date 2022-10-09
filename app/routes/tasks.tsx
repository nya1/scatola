import { Outlet } from "@remix-run/react";
import { ImportButtonMenu } from "./tasks/importButton";
import {
  ActionIcon,
  Grid,
  Group,
  Header,
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { IconBox, IconMoonStars, IconSun } from "@tabler/icons";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return {
    title: `Tasks list | Scatola`,
  };
};

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

      <Outlet />
    </div>
  );
}
