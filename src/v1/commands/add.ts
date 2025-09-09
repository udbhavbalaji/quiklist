import { Command } from "commander";

import { ListItem, Priority } from "@v1/types/list";
import { loadData, saveData } from "@v1/lib/file-io";
import { err, ok } from "neverthrow";
import logger from "@v1/lib/logger";

export const addToList = (
  dataFilepath: string,
  itemText: string,
  priority: Priority,
  deadline?: string,
) => {
  const item: ListItem = {
    done: false,
    item: itemText,
    priority: priority,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentDataRes = loadData(dataFilepath);

  if (currentDataRes.isErr())
    return err({
      ...currentDataRes.error,
      location: `${currentDataRes.error.location} -> addToList`,
    });

  const data = currentDataRes.value;

  data.push(item);

  const writeDataRes = saveData(data, dataFilepath);

  if (writeDataRes.isErr())
    return err({
      ...writeDataRes.error,
      location: `${writeDataRes.error.location} -> addToList`,
    });

  logger.info("Item added!");
  return ok();
};

const addCommand = new Command("add");

export default addCommand;
