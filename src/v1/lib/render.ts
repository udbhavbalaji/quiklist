import { DateFormat } from "@/types";

export const renderDate = (date: string, dateFormat: DateFormat) => {
  const datePart = date.split("T")[0];
  return dateTransformer[dateFormat](datePart);
};

const dateTransformer: { [K in DateFormat]: (date: string) => string } = {
  "DD-MM-YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2]}-${dateParts[1]}-${[0]}`;
  },
  "YYYY-MM-DD": (date: string) => date,
};
