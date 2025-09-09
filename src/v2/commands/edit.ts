// External imports
import { err, ok } from "neverthrow";

// Internal imports
import { loadList, saveList } from "@v2/lib/file-io";
import {
  formatDateToISO,
  getItemCountsMessage,
  sortByCreatedDate,
  sortByDeadline,
  sortByPriority,
} from "@v2/lib/helpers";
import logger, { DEBUG_HEX } from "@v2/lib/logger";
import {
  getItemToEditPrompt,
  getUpdatedDeadlinePrompt,
  getUpdatedDescriptionPrompt,
  getUpdatePriorityPrompt,
} from "@v2/lib/prompt";
import { dateValidator } from "@v2/lib/validator";
import { DateFormat, PriorityStyle, SortCriteria, SortOrder } from "@v2/types";

// function that edits an item's details in the specified quiklist
const editItemDetails = async (
  datasetFilepath: string,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
  listName: string,
  sortCriteria: SortCriteria,
  sortOrder: SortOrder,
  useEditor: boolean,
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

  const editItemDetailsRes = await getItemToEditPrompt(
    itemOptions,
    dateFormat,
    priorityStyle,
  );
  // const editItemDetailsRes = await editItemPrompt(
  //   itemOptions,
  //   dateFormat,
  //   priorityStyle,
  // );

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
      const updatedItemRes = await getUpdatedDescriptionPrompt(
        selectedItem,
        useEditor,
      );
      // const updatedItemRes = await getUpdatedItemText(selectedItem, useEditor);

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
      const updatedItemRes = await getUpdatePriorityPrompt(selectedItem);
      // const updatedItemRes = await getUpdatedItemPriority(selectedItem);

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
      const updatedItemRes = await getUpdatedDeadlinePrompt(
        selectedItem,
        dateFormat,
      );
      // const updatedItemRes = await getUpdatedItemDeadline(
      //   selectedItem,
      //   dateFormat,
      // );

      if (updatedItemRes.isErr())
        return err({
          ...updatedItemRes.error,
          location: `${updatedItemRes.error.location} -> editItemDetails`,
        });

      if (updatedItemRes.value === "") {
        updatedDeadline = undefined;
      } else {
        const validatedDeadline = await dateValidator(
          formatDateToISO(updatedItemRes.value, dateFormat),
        );

        if (typeof validatedDeadline === "string") {
          logger.error(`${validatedDeadline}. Operation aborted.`);
          process.exit(0);
        }

        updatedDeadline = new Date(
          formatDateToISO(updatedItemRes.value, dateFormat),
        ).toISOString();
      }
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
      unchecked: itemOptions.unchecked.map((item) => {
        const { id, ...mainItem } = item;
        return mainItem;
      }),
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
      checked: itemOptions.checked.map((item) => {
        const { id, ...mainItem } = item;
        return mainItem;
      }),
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
