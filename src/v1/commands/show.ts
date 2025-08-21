import { Command } from "commander";
import { err, ok } from "neverthrow";
import chalk from "chalk";

import { loadData } from "@/lib/file-io";
import logger from "@/lib/logger";
import { renderDate } from "@/lib/render";
import { InternalListItem, ListItem } from "@/types/list";
import { DateFormat } from "@/types";

export const showItems = (
  filepath: string,
  unchecked: boolean,
  dateFormat: DateFormat,
) => {
  const itemsRes = loadData(filepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> showItems`,
    });

  let itemsToDisplay = itemsRes.value;
  let checkedItems: ListItem[];

  if (unchecked) {
    checkedItems = itemsToDisplay.filter((item) => !item.done);
  } else {
    // sort the items with unchecked on top, then based on deadline, and finally on priority,
    const splitItemsRes = splitListItems(items);
  }

  if (itemsToDisplay.length === 0) {
    logger.warn("There are no more unchecked items on your list!");
    return ok();
  }

  itemsToDisplay.forEach((item) => renderItem(item, dateFormat));
};

const renderItem = (item: ListItem, dateFormat: DateFormat) => {
  let output = `[${item.done ? "X" : " "}]  ${item.item}  ::  Added on: ${renderDate(item.createdAt.toISOString(), dateFormat)}`;
  console.log(item.done ? chalk.green.bold(output) : chalk.red.italic(output));
};

const showCommand = new Command("show")
  .description("Show items in your list.")
  .option(
    "-u, --unchecked [unchecked]",
    "Show only unchecked list items.",
    false,
  );

export default showCommand;
