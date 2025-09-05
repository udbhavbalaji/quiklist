// External imports
import { err, ok } from "neverthrow";

// Internal imports
import { loadList } from "@v2/lib/file-io";
import {
  getItemCountsMessage,
  renderItem,
  sortByCreatedDate,
  sortByDeadline,
  sortByPriority,
} from "@v2/lib/helpers";
import logger, { INFO_HEX, PANIC_HEX, DEBUG_HEX } from "@v2/lib/logger";
import { DateFormat, PriorityStyle, SortCriteria, SortOrder } from "@v2/types";

// function that displays the items of the specified quiklist in the console
const showListItems = async (
  filepath: string,
  unchecked: boolean,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
  sortCriteria: SortCriteria,
  sortOrder: SortOrder,
  listName: string,
) => {
  const itemsRes = loadList(filepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> showListItems`,
    });

  const itemOptions = {
    checked: itemsRes.value.checked.map((item) => {
      return { ...item, id: `${item.description}:${item.createdAt}` };
    }),
    unchecked: itemsRes.value.unchecked.map((item) => {
      return { ...item, id: `${item.description}:${item.createdAt}` };
    }),
  };

  switch (sortCriteria) {
    case "priority": {
      sortByPriority(itemOptions, sortOrder);
      break;
    }
    case "deadline": {
      sortByDeadline(itemOptions, sortOrder);
      break;
    }
    case "created date": {
      sortByCreatedDate(itemOptions, sortOrder);
      break;
    }
  }

  logger.hex(PANIC_HEX, "\n -- TODO -- ");
  itemOptions.unchecked.forEach((item) =>
    renderItem(item, dateFormat, priorityStyle),
  );
  if (itemOptions.unchecked.length === 0) {
    logger.hex(PANIC_HEX, "No items to show.");
  }

  if (!unchecked) {
    logger.hex(INFO_HEX, "\n -- COMPLETED -- ");
    itemOptions.checked.forEach((item) =>
      renderItem(item, dateFormat, priorityStyle),
    );
    if (itemOptions.checked.length === 0) {
      logger.hex(INFO_HEX, "No items to show.");
    }
  }

  logger.hex(DEBUG_HEX, "");

  logger.hex(DEBUG_HEX, getItemCountsMessage(itemOptions, listName));

  return ok();
};

export default showListItems;
