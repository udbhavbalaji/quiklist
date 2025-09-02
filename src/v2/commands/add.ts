import { err, ok } from "neverthrow";

import logger from "@v2/lib/logger";
import { loadList, saveList } from "@v2/lib/file-io";
import { Priority, QLListItem } from "@v2/types/list";
import { AddItemToListOptions } from "@v2/types/commands";
import { getItemDescription } from "@v2/lib/prompt";
import { DateFormat } from "@v2/types";
import { dateValidator } from "@v2/lib/validator";
import { formatDateToISO } from "@v2/lib/helpers";

export const handleAddItemCommand = async (
  item_desc: string[],
  options: AddItemToListOptions,
  dateFormat: DateFormat,
) => {
  let itemDesc = item_desc.join(" ");
  if (itemDesc === "") {
    const itemDescRes = await getItemDescription("Enter item description: ");

    if (itemDescRes.isErr())
      return err({
        ...itemDescRes.error,
        location: `${itemDescRes.error.location} -> handleAddItemCommand`,
      });

    itemDesc = itemDescRes.value;
  }

  const priority = options.high
    ? ("HIGH" as Priority)
    : options.medium
      ? ("MEDIUM" as Priority)
      : ("LOW" as Priority);

  let deadline: string | undefined;

  if (options.deadline) {
    const validatedDeadline = await dateValidator(
      formatDateToISO(options.deadline, dateFormat),
    );

    if (typeof validatedDeadline === "string") {
      logger.error(`${validatedDeadline}. Operation aborted.`);
      process.exit(0);
    }

    deadline = new Date(
      formatDateToISO(options.deadline, dateFormat),
    ).toISOString();
  }

  return ok({ itemDesc, priority, deadline });
};

export const addItemToList = async (
  dataFilepath: string,
  description: string,
  priority: Priority,
  deadline?: string,
) => {
  const item: QLListItem = {
    checked: false,
    description,
    priority,
    deadline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentListRes = loadList(dataFilepath);

  if (currentListRes.isErr())
    return err({
      ...currentListRes.error,
      location: `${currentListRes.error.location} -> addItemToList`,
    });

  const list = currentListRes.value;

  list.unchecked.push(item);

  const writeListRes = saveList(list, dataFilepath);

  if (writeListRes.isErr())
    return err({
      ...writeListRes.error,
      location: `${writeListRes.error.location} -> addItemToList`,
    });

  logger.info("Item added!");
  return ok();
};
