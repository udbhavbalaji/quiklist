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
// import { markListItems } from "@v2/lib/prompt";
import { DateFormat, PriorityStyle, SortCriteria, SortOrder } from "@v2/types";
import { QLListItem, QLListOption } from "@v2/types/list";
import { getMarkedItemsPrompt } from "@v2/lib/prompt";

// function that marks/unmarks item(s) as completed within the specified quiklist
const markItems = async (
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
      location: `${itemsRes.error.location} -> markItems`,
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

  const itemsChangedRes = await getMarkedItemsPrompt(
    itemOptions,
    dateFormat,
    priorityStyle,
  );
  // const itemsChangedRes = await markListItems(
  //   itemOptions,
  //   dateFormat,
  //   priorityStyle,
  // );

  if (itemsChangedRes.isErr())
    return err({
      ...itemsChangedRes.error,
      location: `${itemsChangedRes.error.location} -> markItems`,
    });

  const { removed, added } = itemsChangedRes.value;

  const updatedList = mutateList(itemOptions, removed, added);

  const saveListRes = saveList(updatedList, datasetFilepath);

  if (saveListRes.isErr())
    return err({
      ...saveListRes.error,
      location: `${saveListRes.error.location} -> markListItems`,
    });

  let loggerMessage;

  if (removed.length === 0 && added.length === 0) {
    loggerMessage = "No items changed in list.";
  } else {
    loggerMessage = `${added.length > 0 ? `${added.length} item(s) marked. ` : ""}${removed.length > 0 ? `${removed.length} item(s) unmarked.` : ""}`;
  }

  logger.info(loggerMessage);

  return ok();
};

// function that makes the updates to the existing list based on the user's response, returning the updated list
const mutateList = (
  itemOptions: {
    checked: QLListOption[];
    unchecked: QLListOption[];
  },
  removedItems: string[],
  addedItems: string[],
) => {
  const allItemsList = [...itemOptions.checked, ...itemOptions.unchecked];

  const updatedList: { checked: QLListItem[]; unchecked: QLListItem[] } = {
    checked: [],
    unchecked: [],
  };

  allItemsList.forEach((item) => {
    const { id, ...mainItem } = item;

    if (removedItems.includes(id) && mainItem.checked) {
      updatedList.unchecked.push({
        ...mainItem,
        checked: false,
        updatedAt: new Date().toISOString(),
      });
    } else if (addedItems.includes(id) && !mainItem.checked) {
      updatedList.checked.push({
        ...mainItem,
        checked: true,
        updatedAt: new Date().toISOString(),
      });
    } else {
      if (mainItem.checked) updatedList.checked.push(mainItem);
      else updatedList.unchecked.push(mainItem);
    }
  });

  return updatedList;
};

export default markItems;
