import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { ColorScheme } from "@mantine/core";
import {
  Text,
  ActionIcon,
  Grid,
  Group,
  Header,
  useMantineTheme,
} from "@mantine/core";
import {
  MantineProvider,
  createEmotionCache,
  ColorSchemeProvider,
} from "@mantine/core";
import { StylesPlaceholder } from "@mantine/remix";

import { useLocalStorage } from "@mantine/hooks";
import { IconBox, IconSun, IconMoonStars } from "@tabler/icons";
import { ImportButtonMenu } from "./routes/tasks/importButton";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Scatola",
  viewport: "width=device-width,initial-scale=1",
});

createEmotionCache({ key: "mantine" });

export default function App() {
  // TODO change it to be cookie based and try to fix FOUC
  // light / dark mode switch based on local storage
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  const theme = useMantineTheme();

  const logoColor =
    colorScheme === "light" ? theme.colors.gray[9] : theme.colors.gray[2];

  return (
    <html lang="en">
      <head>
        <StylesPlaceholder />
        <Meta />
        <Links />
      </head>
      <body>
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <MantineProvider
            withNormalizeCSS
            withGlobalStyles
            theme={{ colorScheme }}
          >
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
          </MantineProvider>
        </ColorSchemeProvider>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
