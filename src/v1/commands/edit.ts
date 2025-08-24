import { loadData, saveData } from "@/lib/file-io";
import { splitListItems } from "@/lib/list";
import logger from "@/lib/logger";
import {
  editItemPrompt,
  getUpdatedItemDeadline,
  getUpdatedItemPriority,
  getUpdatedItemText,
} from "@/lib/prompt";
import { renderDate } from "@/lib/render";
import { DateFormat } from "@/types";
import { Command } from "commander";
import { err, ok } from "neverthrow";

export const editItemInList = async (
  filepath: string,
  dateFormat: DateFormat,
) => {
  const itemsRes = loadData(filepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> editItemInList`,
    });

  const data = itemsRes.value;

  const itemOptions = data.map((item, idx) => {
    return { ...item, id: `${item.done}_${item.priority}_${idx}` };
  });

  const {
    checkedItems: checkedItemOptions,
    uncheckedItems: uncheckedItemOptions,
  } = splitListItems(itemOptions);

  const editPromptRes = await editItemPrompt(
    checkedItemOptions,
    uncheckedItemOptions,
  );

  if (editPromptRes.isErr())
    return err({
      ...editPromptRes.error,
      location: `${editPromptRes.error} -> editItemInList`,
    });

  const selectedItem = itemOptions.find(
    (item) => item.id === editPromptRes.value.answer,
  );

  if (!selectedItem)
    return err({
      message: "Selected item doesn't exist apparently",
      location: "editItemInList",
    });

  let updatedItemText = selectedItem.item;
  let updatedPriority = selectedItem.priority;
  let updatedDeadline = selectedItem.deadline;
  // let updatedDoneStatus = selectedItem.done;

  let successMessage: string = "This isn't a success.";

  const action = editPromptRes.value.action;

  if (action === "item") {
    const updatedItemRes = await getUpdatedItemText(selectedItem);

    if (updatedItemRes.isErr())
      return err({
        ...updatedItemRes.error,
        location: `${updatedItemRes.error.location} -> editItemInList`,
      });

    updatedItemText = updatedItemRes.value;
    successMessage = "Successfully edited item description!";
  } else if (action === "priority") {
    const updatedItemRes = await getUpdatedItemPriority(selectedItem);

    if (updatedItemRes.isErr())
      return err({
        ...updatedItemRes.error,
        location: `${updatedItemRes.error.location} -> editItemInList`,
      });

    updatedPriority = updatedItemRes.value;
    successMessage = "Successfully edited item's priority level!";
  } else if (action === "deadline") {
    const updatedItemRes = await getUpdatedItemDeadline(
      selectedItem,
      dateFormat,
    );

    if (updatedItemRes.isErr())
      return err({
        ...updatedItemRes.error,
        location: `${updatedItemRes.error.location} -> editItemInList`,
      });

    if (updatedItemRes.value === "") updatedDeadline = undefined;
    else
      updatedDeadline = new Date(
        renderDate(updatedItemRes.value, dateFormat),
      ).toISOString();
    successMessage = "Successfully edited item's deadline!";
  }

  const updatedItem = {
    ...selectedItem,
    item: updatedItemText,
    priority: updatedPriority,
    deadline: updatedDeadline,
    updatedAt: new Date().toISOString(),
  };

  const updatedListItems = itemOptions.map((item) => {
    if (item.id === updatedItem.id) {
      const { id, ...mainItem } = updatedItem;
      return mainItem;
    }
    const { id, ...mainItem } = item;
    return mainItem;
  });

  const saveDataRes = saveData(updatedListItems, filepath);

  if (saveDataRes.isErr())
    return err({ ...saveDataRes.error, location: saveDataRes.error.location });

  logger.info(successMessage);

  return ok();
};

const editCommand = new Command("edit").description("Edit a list item.");

export default editCommand;
