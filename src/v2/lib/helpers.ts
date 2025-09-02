import { DateFormat, SortOrder } from "@v2/types";
import { err } from "neverthrow";
import logger from "./logger";
import { Priority, QLList, QLListItem } from "@v2/types/list";
import { PriorityStyle } from "@v2/types";
import { ERROR_HEX, INFO_HEX } from "@/lib/logger";

const priorityMapping: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const getItemCountsMessage = (
  itemOptions: {
    checked: QLListItem[];
    unchecked: QLListItem[];
  },
  listName: string,
) => {
  return `\nItems Completed in '${listName}': ${itemOptions.checked.length}/${itemOptions.checked.length + itemOptions.unchecked.length}\n`;
};

export const formatDateFromISO = (isoDate: string, dateFormat: DateFormat) => {
  try {
    const datePart = isoDate.split("T")[0];
    return dateTransformer[dateFormat](datePart);
  } catch (error) {
    logger.error((error as Error).message);
    process.exit(1);
  }
};
export const formatDateToISO = (date: string, dateFormat: DateFormat) => {
  try {
    return inverseDateTransformer[dateFormat](date);
  } catch (error) {
    logger.error((error as Error).message);
    process.exit(1);
  }
};

export const sortByDeadline = (list: QLList, sortOrder: SortOrder) => {
  return {
    checked: sortListByDeadline(list.checked, sortOrder),
    unchecked: sortListByDeadline(list.unchecked, sortOrder),
  };
};

export const sortByCreatedDate = (list: QLList, sortOrder: SortOrder) => {
  return sortOrder === "descending"
    ? {
      checked: list.checked.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      unchecked: list.unchecked.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }
    : {
      checked: list.checked.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
      unchecked: list.unchecked.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    };
};

const priorityStyleMapping: Record<PriorityStyle, Record<Priority, string>> = {
  "!/!!/!!!": {
    HIGH: "!!!",
    MEDIUM: "!! ",
    LOW: "!  ",
  },
  "#/##/###": {
    HIGH: "###",
    MEDIUM: "## ",
    LOW: "#  ",
  },
  "*/**/***": {
    HIGH: "***",
    MEDIUM: "** ",
    LOW: "*  ",
  },
  "1/2/3": {
    HIGH: "3",
    MEDIUM: "2",
    LOW: "1",
  },
  none: {
    HIGH: "",
    MEDIUM: "",
    LOW: "",
  },
};

export const getFormattedItem = (
  item: QLListItem,
  format: DateFormat,
  priorityStyle: PriorityStyle,
  excludeBoxes = false,
) => {
  return `${!excludeBoxes ? `[${item.checked ? "✔" : " "}]` : ""}${priorityStyle !== "none" ? `(${priorityStyleMapping[priorityStyle][item.priority]}) ` : ""}${item.description} <Added:${formatDateFromISO(item.createdAt, format)}${item.deadline ? `; Deadline:${formatDateFromISO(item.deadline, format)}` : ""}>`;
};

export const renderItem = (
  item: QLListItem,
  format: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  logger.hex(
    item.checked ? INFO_HEX : ERROR_HEX,
    getFormattedItem(item, format, priorityStyle),
  );
};

export const sortListByDeadline = (
  listItems: QLListItem[],
  sortOrder: SortOrder,
) => {
  const itemsWithDeadline: QLListItem[] = [];
  const itemsWithoutDeadline: QLListItem[] = [];

  listItems.forEach((item) =>
    item.deadline
      ? itemsWithDeadline.push(item)
      : itemsWithoutDeadline.push(item),
  );

  const sortedItems =
    sortOrder === "descending"
      ? itemsWithDeadline.sort(
        (a, b) =>
          new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime(),
      )
      : itemsWithDeadline.sort(
        (a, b) =>
          new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
      );
  return sortedItems.concat(itemsWithoutDeadline);
};

export const sortByPriority = (list: QLList, sortOrder: SortOrder) => {
  if (sortOrder === "descending") {
    return {
      checked: list.checked.sort(
        (a, b) => priorityMapping[b.priority] - priorityMapping[a.priority],
      ),
      unchecked: list.unchecked.sort(
        (a, b) => priorityMapping[b.priority] - priorityMapping[a.priority],
      ),
    };
  }
  return {
    unchecked: list.checked.sort(
      (a, b) => priorityMapping[a.priority] - priorityMapping[b.priority],
    ),
    checked: list.unchecked.sort(
      (a, b) => priorityMapping[a.priority] - priorityMapping[b.priority],
    ),
  };
};

const dateTransformer: Record<DateFormat, (date: string) => string> = {
  "DD-MM-YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}-${dateParts[0]}`;
  },
  "YYYY-MM-DD": (date: string) => date,
  "DD/MM/YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2].padStart(2, "0")}/${dateParts[1].padStart(2, "0")}/${dateParts[0]}`;
  },
  "YYYY/MM/DD": (date: string) => date.replace("-", "/"),
};

const inverseDateTransformer: Record<DateFormat, (date: string) => string> = {
  "DD-MM-YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`;
  },
  "YYYY-MM-DD": (date: string) => date,
  "DD/MM/YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2]}/${dateParts[1].padStart(2, "0")}/${dateParts[0].padStart(2, "0")}`;
  },
  "YYYY/MM/DD": (date: string) => date.replace("/", "-"),
};
