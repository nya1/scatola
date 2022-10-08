import { useMantineTheme } from "@mantine/core";
import React from "react";
import { stringToHslColor } from "~/utils";

/**
 * render custom badge with color based on the tag provided
 */
export function CustomBadge(params: React.PropsWithChildren) {
  const themes = useMantineTheme();

  if (!params.children) {
    return null;
  }

  const textVal = params.children?.toString();

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
