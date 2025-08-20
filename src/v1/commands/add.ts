import { Command } from "commander";

import { ListItem, Priority } from "@/types/list";
import { loadData, saveData } from "@/lib/file-io";
import { err, ok } from "neverthrow";

export const addToList = (
  dataFilepath: string,
  itemText: string,
  priority?: Priority,
  deadline?: string,
) => {
  const item: ListItem = {
    done: false,
    item: itemText,
    priority: priority ?? undefined,
    deadline: deadline ? new Date(deadline) : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const currentDataRes = loadData(dataFilepath);

  if (currentDataRes.isErr())
    return err({
      ...currentDataRes.error,
      location: currentDataRes.error.location,
    });

  const data = currentDataRes.value;

  data.push(item);

  const writeDataRes = saveData(data, dataFilepath);

  if (writeDataRes.isErr())
    return err({
      ...writeDataRes.error,
      location: writeDataRes.error.location,
    });
  return ok();
};

const addCommand = new Command("add");

export default addCommand;
