import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type {
  ColorScheme} from "@mantine/core";
import {
  MantineProvider,
  createEmotionCache,
  ColorSchemeProvider
} from "@mantine/core";
import { StylesPlaceholder } from "@mantine/remix";

import { useLocalStorage } from "@mantine/hooks";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
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
            {/* https://github.com/franck-boucher/mantine-stack/blob/700b798172a8dd77b3350e56d3016eba9681dde6/app/root.tsx#L3 */}
            {/* <GlobalStyles /> */}
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
