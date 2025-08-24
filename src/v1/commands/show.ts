import { Command } from "commander";
import { err, ok } from "neverthrow";
import chalk from "chalk";

import { loadData } from "@/lib/file-io";
import logger, { INFO_HEX, PANIC_HEX } from "@/lib/logger";
import { renderDate } from "@/lib/render";
import {
  ListItem,
  PriorityStyle,
  SortCriteria,
  SortOrder,
  styleMapping,
} from "@/types/list";
import { DateFormat } from "@/types";
import {
  sortByCreatedDate,
  sortByDeadline,
  sortByPriority,
  splitListItems,
} from "@/lib/list";

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
    }
    case "created": {
      checkedItems = sortByCreatedDate(checkedItems, sortOrder);
      uncheckedItems = sortByCreatedDate(uncheckedItems, sortOrder);
    }
    case "deadline": {
      checkedItems = sortByDeadline(checkedItems, sortOrder);
      uncheckedItems = sortByDeadline(uncheckedItems, sortOrder);
    }
    case "none": {
      logger.debug("Sorting skipped!");
    }
  }

  logger.hex(PANIC_HEX, "\n -- TODO --");
  uncheckedItems.forEach((item) => renderItem(item, dateFormat, priorityStyle));
  if (uncheckedItems.length === 0) {
    logger.hex(PANIC_HEX, "No items to show.");
  }

  if (!unchecked) {
    logger.hex(INFO_HEX, "\n -- COMPLETED -- ");
    checkedItems.forEach((item) => renderItem(item, dateFormat, priorityStyle));
    if (checkedItems.length === 0) {
      logger.hex(INFO_HEX, "No items to show.");
    }
  }
  return ok();
};

const renderItem = (
  item: ListItem,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  let output = `[${item.done ? "X" : " "}] ${priorityStyle !== "none" ? ` ${styleMapping[priorityStyle][item.priority]} ` : ""} ${item.item} :: Added on: ${renderDate(item.createdAt, dateFormat)}${item.deadline ? `    {Deadline: ${renderDate(item.deadline, dateFormat, true)}}` : ""}`;

  console.log(
    // output,
    item.done
      ? chalk.hex(INFO_HEX).italic(output)
      : chalk.hex(PANIC_HEX).italic(output),
  );
};

const showCommand = new Command("show")
  .description("Show items in your list.")
  .option(
    "-u, --unchecked [unchecked]",
    "Show only unchecked list items.",
    false,
  );

export default showCommand;
