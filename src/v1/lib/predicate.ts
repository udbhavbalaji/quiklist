import * as path from "path";

import { QLCompleteConfig } from "../types/config";
import { err, ok } from "neverthrow";
import { LogLevel } from "@udawg00/logify";

export const isProcessWithinCreatedList = (
  existingLists: QLCompleteConfig["lists"],
) => {
  const currentProcessPath = path.normalize(process.cwd());

  for (const [key, value] of Object.entries(existingLists)) {
    const listPath = path.normalize(value);
    if (currentProcessPath.startsWith(listPath)) {
      return ok({ key, value });
    }
  }
  return err({
    message: "No list found here.",
    location: "isProcessWithinCreatedList",
    messageLevel: "warn" as LogLevel,
  });
};
