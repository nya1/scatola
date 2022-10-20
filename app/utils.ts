import { useMatches, useTransition } from "@remix-run/react";
import { marked } from "marked";
import { useEffect, useMemo, useRef } from "react";
import { sanitize } from "dompurify";

import type { QUnitType } from "dayjs";
import dayjs from "dayjs";

import type { User } from "./models/user.server";
import type { z } from "zod";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.email === "string";
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

function __safeGetQueryParam(
  parsedUrl: URL,
  queryParam: string
): string | undefined {
  return parsedUrl?.searchParams?.get(queryParam) || undefined;
}

/**
 * extract known fields from query params
 */
export function getQueryParams(url: string) {
  const parsedUrl = new URL(url);
  return {
    activeContext: __safeGetQueryParam(parsedUrl, "activeContext"),
    tags: __safeGetQueryParam(parsedUrl, "tags"),
    type: __safeGetQueryParam(parsedUrl, "type"),
  };
}

export function getContextFromUrl(url: string) {
  return getQueryParams(url).activeContext;
}

/**
 * compose a redirect url with whitelisted fields
 */
export function composeWhitelistedRedirectUrl(
  newPath: string,
  params: {
    context?: string;
  }
) {
  let path = `${newPath}`;
  if (params.context) {
    path += `?context=${params.context}`;
  }
  return path;
}

export function composeRedirectUrlWithContext(
  newPath: string,
  originalUrl: URL
) {
  const contextToUse = originalUrl.searchParams?.get("context");
  return composeWhitelistedRedirectUrl(newPath, {
    context: contextToUse || undefined,
  });
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * compute a color from the provided string
 */
export function stringToHslColor(str: string, s: number, l: number) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + (((hash << 5) >>> 0) - hash);
  }

  var h = hash % 360;
  return "hsl(" + h + ", " + s + "%, " + l + "%)";
}

// from https://github.com/remix-run/remix/discussions/3313
export function useTransitionTracking() {
  const transition = useTransition();
  const prevState = useRef(transition.state);

  useEffect(() => {
    prevState.current = transition.state;
  }, [transition.state]);

  return {
    ...transition,
    stateChangedTo:
      prevState.current === transition.state ? null : transition.state,
  };
}

// TODO move this server side?
/**
 * safely transform markdown string to parsed html
 */
export function safeMarked(markdownStr: string) {
  return sanitize(marked(markdownStr));
}

export function toHumanReadableDate(dueDate?: string | null) {
  if (dueDate) {
    const originalDueDate = dueDate;
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
    // unablet to find a human readable compatible diff, display only iso date
    if (originalDueDate === dueDate) {
      dueDate = dayjs(originalDueDate).format(`YYYY-MM-DD`);
    }
  }
  return dueDate;
}

// from https://gist.github.com/fnky/7fe414b402baf5c9ba8f7ddecfdd263e
// This type infer errors from a ZodType, as produced by `flatten()` of a parsed schema.
export type InferSafeParseErrors<
  T extends z.ZodType<any, any, any>,
  U = string
> = {
  formErrors: U[];
  fieldErrors: {
    [P in keyof z.infer<T>]?: U[];
  };
};

export function getFormDataFieldsAsObject<R extends { [key: string]: unknown }>(
  formData: FormData,
  fields: (keyof R)[] // TODO improve fields typing
) {
  const wrapperObj: { [field: string]: unknown } = {};

  for (const field of fields) {
    const fieldStr = field as string;
    const formVal = formData?.get(fieldStr);
    // empty strings will be automatically converted to undefined
    wrapperObj[fieldStr] = formVal === "" ? undefined : formVal;
  }

  return wrapperObj;
}

export const projectMatches = (
  fullProjectNameSettings: string,
  compareTo: string
): boolean => {
  return new RegExp(
    "^" + fullProjectNameSettings.replace(/\*/g, ".*") + "$"
  ).test(compareTo);
};

export function unpackSearchQuery(text: string) {
  let freeQuery = text;
  const re = /(\w+):\s*(?:"([^"]*)"|(\S+))/g;
  const dict: {[k: string]: string} = {}
  let m: RegExpExecArray | null = re.exec(text);
  while (m) {
    const key = m[1];
    const val = m[3] || m[2];
    dict[key] = val;
    m = re.exec(text)
    // TODO escape when value provided contains quote (mykey:"myvalue")
    freeQuery = freeQuery.replace(new RegExp(`${key}|${val}|:`, 'g'), '').trim();
  }
  
  return {
    dict,
    keys: Object.keys(dict),
    freeQuery,
  };
}
