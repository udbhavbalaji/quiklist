import { loadData, saveData } from "@/lib/file-io";
import { splitListItems } from "@/lib/list";
import logger from "@/lib/logger";
import { itemsPrompt } from "@/lib/prompt";
import { InternalListOption } from "@/types/list";
import { Command } from "commander";
import { err, ok } from "neverthrow";

export const markItemAsDone = async (datasetFilepath: string) => {
  const itemsRes = loadData(datasetFilepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: itemsRes.error.location,
    });

  const itemOptions = itemsRes.value.map((item, idx) => {
    return { ...item, id: `${item.done}_${item.item}_${idx}` };
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

  console.log(markPromptRes.value);

  if (markPromptRes.value.length > 0) {
    updatedListOptions = itemOptions.map((item) => {
      if (markPromptRes.value.includes(item.id)) {
        console.log(item.id);
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

  if (markPromptRes.value.length > 0) logger.info("Deleted item!");
  else logger.info("Not deleting any items.");

  return ok();
};

const markCommand = new Command("mark").description("Mark item as done");

export default markCommand;
