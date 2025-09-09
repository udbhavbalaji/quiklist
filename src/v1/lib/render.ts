import { err, ok } from "neverthrow";

import { DateFormat } from "@v1/types";
import { LogLevel } from "@v1/types/logger";

export const renderDate = (
  date: string,
  dateFormat: DateFormat,
  inverse = false,
) => {
  try {
    const datePart = date.split("T")[0];
    return ok(
      inverse
        ? inverseDateTransformer[dateFormat](datePart)
        : dateTransformer[dateFormat](datePart),
    );
  } catch (error) {
    if ((error as Error).name === "TypeError")
      return err({
        message: "Invalid_date",
        location: "renderDate",
        messageLevel: "error" as LogLevel,
      });
    else
      return err({
        message: (error as Error).message,
        location: "renderDate",
        messageLevel: "error" as LogLevel,
      });
  }

  // const datePart = date.split("T")[0];
  // return inverse
  //   ? inverseDateTransformer[dateFormat](datePart)
  //   : dateTransformer[dateFormat](datePart);
};

// converts iso to preferred format
const dateTransformer: { [K in DateFormat]: (date: string) => string } = {
  "DD-MM-YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}-${dateParts[0]}`;
  },
  "YYYY-MM-DD": (date: string) => date,
};

// converts preferred format to iso date part
const inverseDateTransformer: Record<DateFormat, (date: string) => string> = {
  "DD-MM-YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`;
  },
  "YYYY-MM-DD": (date: string) => date,
};
