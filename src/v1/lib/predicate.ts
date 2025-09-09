import * as path from "path";
import { err, ok } from "neverthrow";

import { QLCompleteConfig } from "@v1/types/config";
import { LogLevel } from "@v1/types/logger";

export const isProcessWithinCreatedList = (
  existingLists: QLCompleteConfig["lists"],
) => {
  const currentProcessPath = path.normalize(process.cwd());

  for (const [key, value] of Object.entries(existingLists)) {
    const listPath = path.dirname(path.normalize(value));
    if (currentProcessPath.startsWith(listPath)) {
      return ok({ key, value });
    } else if (currentProcessPath === listPath) {
      return ok({ key, value });
    }
  }
  return err({
    message: "No list found here.",
    location: "isProcessWithinCreatedList",
    messageLevel: "warn" as LogLevel,
  });
};
