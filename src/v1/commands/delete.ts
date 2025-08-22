import { loadData, saveData } from "@/lib/file-io";
import { splitListItems } from "@/lib/list";
import logger from "@/lib/logger";
import { deleteItemPrompt, itemsPrompt } from "@/lib/prompt";
import { InternalListOption } from "@/types/list";
import { Command } from "commander";
import { err, ok } from "neverthrow";

export const deleteItemFromList = async (filepath: string) => {
  const itemsRes = loadData(filepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> deleteItemFromList`,
    });

  const data = itemsRes.value;

  const itemOptions = data.map((item, idx) => {
    return { ...item, id: `${item.done}_${item.priority}_${idx}` };
  });

  const {
    checkedItems: checkedItemOptions,
    uncheckedItems: uncheckedItemOptions,
  } = splitListItems(itemOptions);

  const deletePromptRes = await itemsPrompt(
    checkedItemOptions,
    uncheckedItemOptions,
    "Select the items you want to delete:",
    true,
    false,
    "delete",
  );

  // todo: need to handle no_items_selected (maybe not)
  if (deletePromptRes.isErr())
    return err({
      ...deletePromptRes.error,
      location: `${deletePromptRes.error.location} -> deleteItemFromList`,
    });

  let updatedListOptions: InternalListOption[] = itemOptions;

  if (deletePromptRes.value.length > 0) {
    updatedListOptions = itemOptions.filter(
      (item) => !deletePromptRes.value.includes(item.id),
    );
  }

  const updatedList = updatedListOptions.map((item) => {
    const { id, ...mainItem } = item;
    return mainItem;
  });

  const saveDataRes = saveData(updatedList, filepath);

  if (saveDataRes.isErr())
    return err({
      ...saveDataRes.error,
      location: `${saveDataRes.error.location} -> deleteFromList`,
    });

  if (deletePromptRes.value.length > 0) logger.info("Deleted item!");
  else logger.info("Not deleting any items.");

  return ok();
};

const deleteCommand = new Command("delete").description(
  "Delete an item from the list.",
);

export default deleteCommand;
