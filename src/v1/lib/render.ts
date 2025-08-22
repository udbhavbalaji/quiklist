import { DateFormat } from "@/types";

export const renderDate = (
  date: string,
  dateFormat: DateFormat,
  inverse = false,
) => {
  const datePart = date.split("T")[0];
  return inverse
    ? inverseDateTransformer[dateFormat](datePart)
    : dateTransformer[dateFormat](datePart);
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
