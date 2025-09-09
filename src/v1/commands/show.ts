import { Command } from "commander";
import { err, ok } from "neverthrow";
import chalk from "chalk";

import { loadData } from "@v1/lib/file-io";
import logger, {
  DEBUG_HEX,
  ERROR_HEX,
  INFO_HEX,
  PANIC_HEX,
} from "@v1/lib/logger";
import { renderDate } from "@v1/lib/render";
import {
  ListItem,
  PriorityStyle,
  SortCriteria,
  SortOrder,
  styleMapping,
} from "@v1/types/list";
import { DateFormat } from "@v1/types";
import {
  sortByCreatedDate,
  sortByDeadline,
  sortByPriority,
  splitListItems,
} from "@v1/lib/list";
import { errorHandler } from "@v1/lib/error-handle";

export const showItems = (
  filepath: string,
  unchecked: boolean,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
  sortCriteria: SortCriteria,
  sortOrder: SortOrder,
) => {
  const itemsRes = loadData(filepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> showItems`,
    });

  const itemOptions = itemsRes.value.map((item, idx) => {
    return { ...item, id: `${item.done}_${item.priority}_${idx}` };
  });

  let { checkedItems, uncheckedItems } = splitListItems(itemOptions);

  switch (sortCriteria) {
    case "priority": {
      checkedItems = sortByPriority(checkedItems, sortOrder);
      uncheckedItems = sortByPriority(uncheckedItems, sortOrder);
      break;
    }
    case "created": {
      checkedItems = sortByCreatedDate(checkedItems, sortOrder);
      uncheckedItems = sortByCreatedDate(uncheckedItems, sortOrder);
      break;
    }
    case "deadline": {
      checkedItems = sortByDeadline(checkedItems, sortOrder);
      uncheckedItems = sortByDeadline(uncheckedItems, sortOrder);
      break;
    }
    case "none": {
      logger.debug("Sorting skipped!");
      break;
    }
  }

  logger.hex(ERROR_HEX, "\n -- TODO --");
  uncheckedItems.forEach((item) => renderItem(item, dateFormat, priorityStyle));
  if (uncheckedItems.length === 0) {
    logger.hex(ERROR_HEX, "No items to show.");
  }

  if (!unchecked) {
    logger.hex(INFO_HEX, "\n -- COMPLETED -- ");
    checkedItems.forEach((item) => renderItem(item, dateFormat, priorityStyle));
    if (checkedItems.length === 0) {
      logger.hex(INFO_HEX, "No items to show.");
    }
  }
  logger.hex(DEBUG_HEX, "");
  return ok();
};

const renderItem = (
  item: ListItem,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  let output = `[${item.done ? "✔" : " "}] ${priorityStyle !== "none" ? ` ${styleMapping[priorityStyle][item.priority]} ` : ""} ${item.item} :: Added on: ${errorHandler(renderDate(item.createdAt, dateFormat))}${item.deadline ? `    {Deadline: ${errorHandler(renderDate(item.deadline, dateFormat, true))}}` : ""}`;

  logger.hex(item.done ? INFO_HEX : ERROR_HEX, output);
};

const showCommand = new Command("show")
  .description("Show items in your list.")
  .option(
    "-u, --unchecked [unchecked]",
    "Show only unchecked list items.",
    false,
  );

export default showCommand;
