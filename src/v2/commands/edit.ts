import { loadList, saveList } from "@v2/lib/file-io";
import { getItemCountsMessage } from "@v2/lib/helpers";
import logger, { DEBUG_HEX } from "@v2/lib/logger";
import {
  editItemPrompt,
  getUpdatedItemText,
  getUpdatedItemDeadline,
  getUpdatedItemPriority,
} from "@v2/lib/prompt";
import { DateFormat, PriorityStyle } from "@v2/types";
import { err, ok } from "neverthrow";

const editItemDetails = async (
  datasetFilepath: string,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
  listName: string,
) => {
  const itemsRes = loadList(datasetFilepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> editItemDetails`,
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

  const editItemDetailsRes = await editItemPrompt(
    itemOptions,
    dateFormat,
    priorityStyle,
  );

  if (editItemDetailsRes.isErr())
    return err({
      ...editItemDetailsRes.error,
      location: `${editItemDetailsRes.error.location} -> editItemDetails`,
    });

  let selectedItem =
    itemOptions.checked.find(
      (item) => item.id === editItemDetailsRes.value.answer,
    ) ??
    itemOptions.unchecked.find(
      (item) => item.id === editItemDetailsRes.value.answer,
    );

  if (!selectedItem)
    return err({
      message: "Selected item doesn't exist apparently",
      location: "editItemDetails",
    });

  let updatedPriority = selectedItem.priority;
  let updatedDescription = selectedItem.description;
  let updatedDeadline = selectedItem.deadline;

  let message = "Please choose an action for the highlighted item!";

  const action = editItemDetailsRes.value.action;

  switch (action) {
    case "item": {
      const updatedItemRes = await getUpdatedItemText(selectedItem);

      if (updatedItemRes.isErr())
        return err({
          ...updatedItemRes.error,
          location: `${updatedItemRes.error.location} -> editItemDetails`,
        });

      updatedDescription = updatedItemRes.value;
      message = "Successfully edited item's description!";
      break;
    }
    case "priority": {
      const updatedItemRes = await getUpdatedItemPriority(selectedItem);

      if (updatedItemRes.isErr())
        return err({
          ...updatedItemRes.error,
          location: `${updatedItemRes.error.location} -> editItemDetails`,
        });

      updatedPriority = updatedItemRes.value;
      message = "Successfully edited item's priority!";
      break;
    }
    case "deadline": {
      const updatedItemRes = await getUpdatedItemDeadline(
        selectedItem,
        dateFormat,
      );

      if (updatedItemRes.isErr())
        return err({
          ...updatedItemRes.error,
          location: `${updatedItemRes.error.location} -> editItemDetails`,
        });

      updatedDeadline = updatedItemRes.value;
      message = "Successfully edited item's deadline!";
      break;
    }
  }

  const updatedItem = {
    ...selectedItem,
    description: updatedDescription,
    priority: updatedPriority,
    deadline: updatedDeadline,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = updatedItem.checked
    ? {
      ...itemOptions,
      checked: itemOptions.checked.map((item) => {
        if (item.id === updatedItem.id) {
          const { id, ...mainItem } = updatedItem;
          return mainItem;
        }
        const { id, ...mainItem } = item;
        return mainItem;
      }),
    }
    : {
      ...itemOptions,
      unchecked: itemOptions.unchecked.map((item) => {
        if (item.id === updatedItem.id) {
          const { id, ...mainItem } = updatedItem;
          return mainItem;
        }
        const { id, ...mainItem } = item;
        return mainItem;
      }),
    };

  const saveListRes = saveList(updatedList, datasetFilepath);

  if (saveListRes.isErr())
    return err({
      ...saveListRes.error,
      location: `${saveListRes.error.location} -> editItemDetails`,
    });

  logger[
    message === "Please choose an action for the highlighted item!"
      ? "error"
      : "info"
  ](message);

  return ok();
};

export default editItemDetails;
