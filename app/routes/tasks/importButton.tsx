import { Button, Menu, Text, useMantineTheme } from "@mantine/core";
import { Link } from "@remix-run/react";
import {
  IconSquareCheck,
  IconPackage,
  IconUsers,
  IconCalendar,
  IconChevronDown,
  IconBrandGitlab,
} from "@tabler/icons";

export function ImportButtonMenu() {
  const theme = useMantineTheme();
  return (
    <>
      <Menu transitionDuration={0} withArrow width={150}>
        <Menu.Target>
          <Button
            variant="outline"
            rightIcon={<IconChevronDown size={18} stroke={1.5} />}
            pr={12}
          >
            Sync tickets
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>From</Menu.Label>
          <Menu.Item
            component={Link}
            to="/import/?type=gitlab"
            icon={
              <IconBrandGitlab
                size={16}
                stroke={0}
                fill={theme.colors.orange[6]}
              />
            }
          >
            GitLab
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
