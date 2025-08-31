import { loadList } from "@v2/lib/file-io";
import logger from "@v2/lib/logger";
import { markListItems } from "@v2/lib/prompt";
import { DateFormat, PriorityStyle } from "@v2/types";
import { err, ok } from "neverthrow";

const markItems = async (
  datasetFilepath: string,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  const itemsRes = loadList(datasetFilepath);

  if (itemsRes.isErr())
    return err({
      ...itemsRes.error,
      location: `${itemsRes.error.location} -> markItems`,
    });

  const itemOptions = {
    checked: itemsRes.value.checked.map((item) => {
      return { ...item, id: `${item.description}:${item.createdAt}` };
    }),
    unchecked: itemsRes.value.unchecked.map((item) => {
      return { ...item, id: `${item.description}:${item.createdAt}` };
    }),
  };

  const itemsChangedRes = await markListItems(
    itemOptions,
    dateFormat,
    priorityStyle,
  );

  if (itemsChangedRes.isErr())
    return err({
      ...itemsChangedRes.error,
      location: `${itemsChangedRes.error.location} -> markItems`,
    });

  const { removed, added } = itemsChangedRes.value;

  // need to update the datalist

  let loggerMessage;

  if (removed.length === 0 && added.length === 0) {
    loggerMessage = "No items changed in list.";
  } else {
    loggerMessage = `${added.length > 0 ? `${added.length} items marked. ` : ""}${removed.length > 0 ? `${removed.length} items unmarked.` : ""}`;
  }

  logger.info(loggerMessage);

  return ok();
};

export default markItems;
