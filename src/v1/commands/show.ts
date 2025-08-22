import { Command } from "commander";
import { err, ok } from "neverthrow";
import chalk from "chalk";

import { loadData } from "@/lib/file-io";
import logger from "@/lib/logger";
import { renderDate } from "@/lib/render";
import {
  ListItem,
  Priority,
  PriorityStyle,
  SortCriteria,
  SortOrder,
  styleMapping,
} from "@/types/list";
import { DateFormat } from "@/types";
import {
  priorityMapping,
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

  if (!unchecked) {
    // console.log(chalk.hex("#72e00b").italic("\n -- COMPLETED -- "));
    console.log("\n -- COMPLETED -- ");
    checkedItems.forEach((item) => renderItem(item, dateFormat, priorityStyle));
  }

  // console.log(chalk.hex("#f7ac20").italic("\n -- TODO -- "));

  console.log("\n -- TODO -- ");
  uncheckedItems.forEach((item) => renderItem(item, dateFormat, priorityStyle));

  logger.warn("There are no more unchecked items on your list!");
  return ok();
};

const renderItem = (
  item: ListItem,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  let output = `[${item.done ? "X" : " "}] ${item.priority ? ` ${styleMapping[priorityStyle][item.priority]} ` : ""} ${item.item} :: Added on: ${renderDate(item.createdAt, dateFormat)}${item.deadline ? `    {Deadline: ${renderDate(item.deadline, dateFormat, true)}}` : ""}`;

  console.log(
    output,
    // item.done
    //   ? chalk.green.italic(output)
    //   : chalk.hex("#f7ac20").italic(output),
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
