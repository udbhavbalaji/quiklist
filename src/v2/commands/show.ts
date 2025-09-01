import { loadList } from "@v2/lib/file-io";
import {
  renderItem,
  sortByCreatedDate,
  sortByDeadline,
  sortByPriority,
} from "@v2/lib/helpers";
import logger, { INFO_HEX, ERROR_HEX, DEBUG_HEX } from "@v2/lib/logger";
import { DateFormat, PriorityStyle, SortCriteria, SortOrder } from "@v2/types";
import { QLList } from "@v2/types/list";
import { err, ok } from "neverthrow";

const showListItems = async (
  filepath: string,
  unchecked: boolean,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
  sortCriteria: SortCriteria,
  sortOrder: SortOrder,
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

  let sortedItemOptions: QLList;

  switch (sortCriteria) {
    case "priority": {
      sortedItemOptions = sortByPriority(itemOptions, sortOrder);
      break;
    }
    case "deadline": {
      sortedItemOptions = sortByDeadline(itemOptions, sortOrder);
      break;
    }
    case "created date": {
      sortedItemOptions = sortByCreatedDate(itemOptions, sortOrder);
      break;
    }
    default: {
      sortedItemOptions = itemsRes.value;
      break;
    }
  }

  logger.hex(ERROR_HEX, "\n -- TODO -- ");
  sortedItemOptions.unchecked.forEach((item) =>
    renderItem(item, dateFormat, priorityStyle),
  );
  if (sortedItemOptions.unchecked.length === 0) {
    logger.hex(ERROR_HEX, "No items to show.");
  }

  if (!unchecked) {
    logger.hex(INFO_HEX, "\n -- COMPLETED -- ");
    sortedItemOptions.checked.forEach((item) =>
      renderItem(item, dateFormat, priorityStyle),
    );
    if (sortedItemOptions.checked.length === 0) {
      logger.hex(INFO_HEX, "No items to show.");
    }
  }

  logger.hex(DEBUG_HEX, "");
  return ok();
};

export default showListItems;
