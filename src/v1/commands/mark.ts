import { Command } from "commander";
import { err, ok } from "neverthrow";

import { loadData, saveData } from "@v1/lib/file-io";
import { splitListItems } from "@v1/lib/list";
import logger from "@v1/lib/logger";
import { itemsPrompt } from "@v1/lib/prompt";
import { InternalListOption } from "@v1/types/list";

export const markItemAsDone = async (datasetFilepath: string) => {
  const itemsRes = loadData(datasetFilepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: itemsRes.error.location,
    });

  const itemOptions = itemsRes.value.map((item, idx) => {
    return { ...item, id: `${item.done}_${item.priority}_${idx}` };
  });

  const {
    checkedItems: checkedItemOptions,
    uncheckedItems: uncheckedItemOptions,
  } = splitListItems(itemOptions);

  const markPromptRes = await itemsPrompt(
    checkedItemOptions,
    uncheckedItemOptions,
    "Mark/Unmark items:",
    false,
    false,
    "mark",
  );

  if (markPromptRes.isErr())
    return err({
      ...markPromptRes.error,
      location: `${markPromptRes.error.location} -> deleteItemFromList`,
    });

  let updatedListOptions: InternalListOption[] = itemOptions;

  if (markPromptRes.value.length > 0) {
    updatedListOptions = itemOptions.map((item) => {
      if (markPromptRes.value.includes(item.id)) {
        return { ...item, done: true };
      } else return { ...item, done: false };
    });
  } else if (
    markPromptRes.value.length === 0 &&
    checkedItemOptions.length > 0
  ) {
    updatedListOptions = itemOptions.map((item) => {
      if (markPromptRes.value.includes(item.id)) {
        return { ...item, done: true };
      } else return { ...item, done: false };
    });
  }

  const updatedList = updatedListOptions.map((item) => {
    const { id, ...mainItem } = item;
    return mainItem;
  });

  const saveDataRes = saveData(updatedList, datasetFilepath);

  if (saveDataRes.isErr())
    return err({
      ...saveDataRes.error,
      location: `${saveDataRes.error.location} -> deleteFromList`,
    });

  if (markPromptRes.value.length > 0)
    logger.info(`Updated ${markPromptRes.value.length} items.`);
  else if (markPromptRes.value.length === 0 && checkedItemOptions.length > 0)
    logger.info(`Updated ${checkedItemOptions.length} items.`);
  else logger.warn("Not marking any items.");

  return ok();
};

const markCommand = new Command("mark").description("Mark item as done");

export default markCommand;
