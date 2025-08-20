import * as path from "path";
import { err, ok } from "neverthrow";
import { LogLevel } from "@udawg00/logify";

import { QLCompleteConfig } from "@/types/config";

export const isProcessWithinCreatedList = (
  existingLists: QLCompleteConfig["lists"],
) => {
  const currentProcessPath = path.normalize(process.cwd());

  for (const [key, value] of Object.entries(existingLists)) {
    const listPath = path.dirname(path.normalize(value));
    console.log("currentProcessPath", currentProcessPath);
    console.log("listPath", listPath);
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
