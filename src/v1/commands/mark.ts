import { loadData, saveData } from "@/lib/file-io";
import logger from "@/lib/logger";
import { markItemsPrompt } from "@/lib/prompt";
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
    return { ...item, id: `${item.item}_${idx}` };
  });

  const unmarkedItems = itemOptions.filter((item) => !item.done);

  const markedItemsRes = await markItemsPrompt(unmarkedItems);

  if (markedItemsRes.isErr())
    return err({
      ...markedItemsRes.error,
      location: `${markedItemsRes.error.location} -> markItemAsDone`,
    });

  const updatedItems = itemOptions.map((item) => {
    if (markedItemsRes.value.includes(item.id)) {
      const { id, ...listItem } = item;
      return { ...listItem, done: true };
    } else {
      const { id, ...listItem } = item;
      return listItem;
    }
  });

  const updateItemsRes = saveData(updatedItems, datasetFilepath);

  if (updateItemsRes.isErr())
    return err({
      ...updateItemsRes.error,
      location: `${updateItemsRes.error.location} -> markItemAsDone`,
    });

  logger.info(`Marked ${markedItemsRes.value.length} items as done.`);

  return ok();
};

const markCommand = new Command("mark").description("Mark item as done");

export default markCommand;
