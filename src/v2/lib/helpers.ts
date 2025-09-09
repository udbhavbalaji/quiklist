// Internal imports
import { DateFormat, SortOrder } from "@v2/types";
import logger, { PANIC_HEX, INFO_HEX } from "@v2/lib/logger";
import { Priority, QLList, QLListItem } from "@v2/types/list";
import { PriorityStyle } from "@v2/types";

// module-level vars
// mapping to assign numerical value to priority level for sorting purposes
const priorityMapping: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
// mapping to render corresponding priority level based on user's preferred style
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
// mapping that maps the user's chosen date format to a function that transforms it into that format from "YYYY-MM-DD" (date part of ISO string)
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
// mapping that maps the user's chosen date format to a function that transforms it from that format to "YYYY-MM-DD" (date part of ISO string)
const inverseDateTransformer: Record<DateFormat, (date: string) => string> = {
  "DD-MM-YYYY": (date: string) => {
    const dateParts = date.split("-");
    return `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`;
  },
  "YYYY-MM-DD": (date: string) => date,
  "DD/MM/YYYY": (date: string) => {
    const dateParts = date.split("/");
    return `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`;
  },
  "YYYY/MM/DD": (date: string) => date.replace("/", "-"),
};

// function that counts the number of items in the list (checked and unchecked), embeds it into a string message and return
export const getItemCountsMessage = (
  itemOptions: {
    checked: QLListItem[];
    unchecked: QLListItem[];
  },
  listName: string,
) => {
  return `\nItems Completed in '${listName}': ${itemOptions.checked.length}/${itemOptions.checked.length + itemOptions.unchecked.length}\n`;
};

// function that transforms an ISO date string to a date in the user's specified format
export const formatDateFromISO = (isoDate: string, dateFormat: DateFormat) => {
  try {
    const datePart = isoDate.split("T")[0];
    return dateTransformer[dateFormat](datePart);
  } catch (error) {
    logger.error((error as Error).message);
    process.exit(1);
  }
};

// function that transforms a date string from the user's specified format to the date part of ISO string format
export const formatDateToISO = (date: string, dateFormat: DateFormat) => {
  try {
    return inverseDateTransformer[dateFormat](date);
  } catch (error) {
    logger.error((error as Error).message);
    process.exit(1);
  }
};

// function that sorts list items by deadline
export const sortByDeadline = (list: QLList, sortOrder: SortOrder) => {
  return {
    checked: sortListByDeadline(list.checked, sortOrder),
    unchecked: sortListByDeadline(list.unchecked, sortOrder),
  };
};

// function that sorts list items by created date
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

// function that returns a well-formatted string, embedding details into the item based on user preferences
export const getFormattedItem = (
  item: QLListItem,
  format: DateFormat,
  priorityStyle: PriorityStyle,
  excludeBoxes = false,
) => {
  return `${!excludeBoxes ? `[${item.checked ? "✔" : " "}]` : ""}${priorityStyle !== "none" ? `(${priorityStyleMapping[priorityStyle][item.priority]}) ` : " "}${item.description} <Added:${formatDateFromISO(item.createdAt, format)}${item.deadline ? `; Deadline:${formatDateFromISO(item.deadline, format)}` : ""}>`;
};

// function that renders the well-formatted item in the required color
export const renderItem = (
  item: QLListItem,
  format: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  logger.hex(
    item.checked ? INFO_HEX : PANIC_HEX,
    getFormattedItem(item, format, priorityStyle),
  );
};

// internal function that sorts array of items using the deadline (used by the main sortByDeadline)
const sortListByDeadline = (listItems: QLListItem[], sortOrder: SortOrder) => {
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

// function that sorts list items by priority
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
    unchecked: list.unchecked.sort(
      (a, b) => priorityMapping[a.priority] - priorityMapping[b.priority],
    ),
    checked: list.checked.sort(
      (a, b) => priorityMapping[a.priority] - priorityMapping[b.priority],
    ),
  };
};

// function that outputs a well-indented string from a JSON object
export const getFormattedJSON = (
  obj: Record<any, any> | Array<any>,
  indentLevel: number = 0,
): string => {
  let output = "";
  let indent = "  ".repeat(indentLevel);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";

    output += "[\n";

    obj.forEach((item) => {
      if (typeof item === "object") {
        output += `${indent}  ${getFormattedJSON(item, indentLevel + 1)},\n`;
      } else {
        output += `${indent}  ${item},\n`;
      }
    });

    output += `${indent}]`;
  } else {
    const props = Object.keys(obj);

    if (props.length === 0) return "{}";

    output += "{\n";

    for (const prop of props) {
      if (typeof obj[prop] === "object") {
        output += `${indent}  ${prop}: ${getFormattedJSON(obj[prop], indentLevel + 1)},\n`;
      } else if (typeof obj[prop] === "string") {
        output += `${indent}  ${prop}: "${obj[prop]}",\n`;
      } else {
        output += `${indent}  ${prop}: ${obj[prop]},\n`;
      }
    }

    output += `${indent}}`;
  }

  return output;
};
