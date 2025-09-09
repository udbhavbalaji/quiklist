// External imports
import { err, ok } from "neverthrow";

// Internal imports
import { loadList, saveList } from "@v2/lib/file-io";
import {
  getItemCountsMessage,
  sortByCreatedDate,
  sortByDeadline,
  sortByPriority,
} from "@v2/lib/helpers";
import logger, { DEBUG_HEX } from "@v2/lib/logger";
import { DateFormat, PriorityStyle, SortCriteria, SortOrder } from "@v2/types";
import { deleteListItemsPrompt } from "@v2/lib/prompt";

// function that deletes items from the specified quiklist
const deleteItems = async (
  datasetFilepath: string,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
  listName: string,
  sortCriteria: SortCriteria,
  sortOrder: SortOrder,
) => {
  const itemsRes = loadList(datasetFilepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> deleteItems`,
    });

  const itemOptions = {
    checked: itemsRes.value.checked.map((item) => {
      return { ...item, id: `${item.description}:${item.createdAt}` };
    }),
    unchecked: itemsRes.value.unchecked.map((item) => {
      return { ...item, id: `${item.description}:${item.createdAt}` };
    }),
  };

  logger.hex(DEBUG_HEX, getItemCountsMessage(itemOptions, listName));

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

  const itemsDeletedRes = await deleteListItemsPrompt(
    itemOptions,
    dateFormat,
    priorityStyle,
  );

  if (itemsDeletedRes.isErr())
    return err({
      ...itemsDeletedRes.error,
      location: `${itemsDeletedRes.error.location} -> deleteItems`,
    });

  const updatedList = {
    checked: itemOptions.checked
      .filter((item) => !itemsDeletedRes.value.includes(item.id))
      .map((item) => {
        const { id, ...mainItem } = item;
        return mainItem;
      }),
    unchecked: itemOptions.unchecked
      .filter((item) => !itemsDeletedRes.value.includes(item.id))
      .map((item) => {
        const { id, ...mainItem } = item;
        return mainItem;
      }),
  };

  const saveListRes = saveList(updatedList, datasetFilepath);

  if (saveListRes.isErr())
    return err({
      ...saveListRes.error,
      location: `${saveListRes.error.location} -> deleteItems`,
    });

  let loggerMessage: string;

  if (itemsDeletedRes.value.length === 0) loggerMessage = "No items deleted.";
  else loggerMessage = `${itemsDeletedRes.value.length} item(s) deleted.`;

  logger.info(loggerMessage);

  return ok();
};

export default deleteItems;
