import z from "zod";
import { err, ok } from "neverthrow";
import { input, select, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import actionSelect from "inquirer-honshin-select";

import { QLUserInputtedConfig } from "@v2/types/config";
import {
  date_formats,
  DateFormat,
  priority_styles,
  PriorityStyle,
  sort_criteria,
  sort_orders,
} from "@v2/types";
import { select as multiSelect, Separator } from "inquirer-select-pro";
import {
  QLGlobalListOptions,
  QLListBasicOptions,
  QLListItem,
  priorities,
} from "@v2/types/list";
import { handlePromptError } from "@v2/lib/handle-error";
import { pathValidator } from "./validator";
import { formatDateFromISO, getFormattedItem } from "./helpers";
import logger, { ERROR_HEX, INFO_HEX, PANIC_HEX } from "./logger";

export const getItemDescription = async (message: string) => {
  try {
    const desc = await input({
      message,
      required: true,
      validate: async (value) => {
        if (value === "") return "Cannot be empty";
        const res = await z.string().safeParseAsync(value);
        if (res.success) return res.success;
        else return res.error.issues[0].message;
      },
    });
    return ok(desc);
  } catch (error) {
    return handlePromptError(error, "getItemDescription");
  }
};

export const createListPrompt = async (
  defaultListOptions: QLGlobalListOptions & QLListBasicOptions,
) => {
  try {
    const name = await input({
      message: "Name of the list: ",
      default: defaultListOptions.name,
    });
    const appDir = await input({
      message: "Where do you want this list data stored? ",
      default: defaultListOptions.appDir,
      validate: pathValidator,
    });
    const priorityStyle = await select({
      message: "Select how you want item priority displayed: ",
      choices: priority_styles.map((value) => {
        return { value };
      }),
      default: defaultListOptions.priorityStyle,
    });
    const sortCriteria = await select({
      message: "On what basis do you want your items sorted? ",
      default: defaultListOptions.sortCriteria,
      choices: sort_criteria.map((value) => {
        return { value };
      }),
    });
    const sortOrder =
      sortCriteria !== "none"
        ? await select({
          message: "Sort ordering: ",
          default: defaultListOptions.sortOrder,
          choices: sort_orders.map((value) => {
            return { value };
          }),
        })
        : defaultListOptions.sortOrder;
    return ok({ name, appDir, priorityStyle, sortCriteria, sortOrder });
  } catch (error) {
    return handlePromptError(error, "createListPrompt");
  }
};

export const deleteListItems = async (
  itemOptions: {
    checked: (QLListItem & { id: string })[];
    unchecked: (QLListItem & { id: string })[];
  },
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  const options = [
    chalk.hex(PANIC_HEX).bold("\n -- TODO -- "),
    ...itemOptions.unchecked.map((item) => {
      const { id, ...mainItem } = item;
      return {
        value: id,
        name: chalk
          .hex(PANIC_HEX)
          .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
      };
    }),
    chalk.hex(INFO_HEX).bold("\n -- COMPLETED -- "),
    ...itemOptions.checked.map((item) => {
      const { id, ...mainItem } = item;
      return {
        value: id,
        name: chalk
          .hex(INFO_HEX)
          .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
      };
    }),
  ];

  try {
    let deletedItems = await multiSelect({
      message: "Select the items you want to delete: ",
      options: options.map((option) =>
        typeof option === "string" ? new Separator(option) : option,
      ),
      multiple: true,
      pageSize: 20,
      theme: {
        icon: {
          checked: "[✘]",
        },
      },
    });

    if (deletedItems.length > 0) {
      const confirmed = await confirm({
        message: "Are you sure you want to delete these items? ",
        default: true,
      });

      if (!confirmed) deletedItems = [];
    }

    return ok(deletedItems);
  } catch (error) {
    return handlePromptError(error, "deleteListItems");
  }
};

// todo: need to handle edge case where user returns empty string
export const getUpdatedItemDeadline = async (
  item: QLListItem & { id: string },
  dateFormat: DateFormat,
) => {
  try {
    const answer = await input({
      message: "Enter updated deadline: ",
      default: item.deadline
        ? formatDateFromISO(item.deadline, dateFormat)
        : formatDateFromISO(new Date().toISOString(), dateFormat),
      prefill: "editable",
    });
    return ok(answer);
  } catch (error) {
    return handlePromptError(error, "getUpdatedItemDeadline");
  }
};

export const getUpdatedItemPriority = async (
  item: QLListItem & { id: string },
) => {
  try {
    const answer = await select({
      message: "Choose updated priority:",
      default: item.priority,
      choices: priorities.map((value) => {
        return { value };
      }),
    });
    return ok(answer);
  } catch (error) {
    return handlePromptError(error, "getUpdatedItemPriority");
  }
};

export const getUpdatedItemText = async (item: QLListItem & { id: string }) => {
  try {
    const answer = await input({
      message: "Make changes to the item",
      default: item.description,
      prefill: "editable",
    });
    if (answer === "") {
      logger.error(
        "Cannot remove entire text content from item. You can delete this item using the 'delete' command",
      );
      return ok(item.description);
    }
    return ok(answer.trim());
  } catch (error) {
    return handlePromptError(error, "getUpdatedItemText");
  }
};

export const editItemPrompt = async (
  itemOptions: {
    checked: (QLListItem & { id: string })[];
    unchecked: (QLListItem & { id: string })[];
  },
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  const options = [
    chalk.hex(PANIC_HEX).bold("\n -- TODO -- "),
    ...itemOptions.unchecked.map((item) => {
      const { id, ...mainItem } = item;
      return {
        value: id,
        name: chalk
          .hex(PANIC_HEX)
          .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
      };
    }),
    chalk.hex(INFO_HEX).bold("\n -- COMPLETED -- "),
    ...itemOptions.checked.map((item) => {
      const { id, ...mainItem } = item;
      return {
        value: id,
        name: chalk
          .hex(INFO_HEX)
          .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
        checked: true,
      };
    }),
  ];

  const actions = [
    {
      value: "item",
      name: "Item",
      key: "i",
    },
    {
      value: "priority",
      name: "Priority",
      key: "p",
    },
    {
      value: "deadline",
      name: "Deadline",
      key: "d",
    },
  ];

  try {
    const answer = await actionSelect({
      message: "Hover on an item and choose an action: ",
      choices: options.map((option) =>
        typeof option === "string" ? new Separator(option) : option,
      ),
      actions: actions,
    });
    return ok(answer);
  } catch (error) {
    return handlePromptError(error, "editItemDetails");
  }
};

export const confirmPrompt = async (message: string) => {
  try {
    const confirmed = await confirm({
      message,
      default: false,
    });
    return ok(confirmed);
  } catch (error) {
    return handlePromptError(error, "confirmPrompt");
  }
};

export const markListItems = async (
  itemOptions: {
    checked: (QLListItem & { id: string })[];
    unchecked: (QLListItem & { id: string })[];
  },
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  // todo: start here
  const options = [
    chalk.hex(PANIC_HEX).bold("\n -- TODO -- "),
    ...itemOptions.unchecked.map((item) => {
      const { id, ...mainItem } = item;
      return {
        value: id,
        name: chalk
          .hex(PANIC_HEX)
          .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
      };
    }),
    chalk.hex(INFO_HEX).bold("\n -- COMPLETED -- "),
    ...itemOptions.checked.map((item) => {
      const { id, ...mainItem } = item;
      return {
        value: id,
        name: chalk
          .hex(INFO_HEX)
          .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
      };
    }),
  ];

  const originalSelectedItems = itemOptions.checked.map((item) => item.id);

  try {
    let selectedItems = await multiSelect({
      message: "Mark/unmark your items: ",
      options: options.map((option) =>
        typeof option === "string" ? new Separator(option) : option,
      ),
      multiple: true,
      defaultValue: originalSelectedItems,
      pageSize: 20,
    });

    const removed = originalSelectedItems.filter(
      (item) => !selectedItems.includes(item),
    );
    const added = selectedItems.filter(
      (item) => !originalSelectedItems.includes(item),
    );

    return ok({ removed, added });
  } catch (error) {
    return handlePromptError(error, "markListItems");
  }
};

export const globalListPrompt = async (
  defaultGlobalListOptions: QLGlobalListOptions,
) => {
  try {
    const priorityStyle = await select({
      message: "Select your preferred style for displaying priority",
      choices: priority_styles.map((value) => {
        return { value };
      }),
      default: defaultGlobalListOptions.priorityStyle,
    });
    const sortCriteria = await select({
      message: "Select sorting criteria: ",
      choices: sort_criteria.map((value) => {
        return { value };
      }),
      default: defaultGlobalListOptions.sortCriteria,
    });
    const sortOrder =
      sortCriteria !== "none"
        ? await select({
          message: "Select sort ordering: ",
          choices: sort_orders.map((value) => {
            return { value };
          }),
          default: defaultGlobalListOptions.sortOrder,
        })
        : defaultGlobalListOptions.sortOrder;
    return ok({ priorityStyle, sortCriteria, sortOrder });
  } catch (error) {
    return handlePromptError(error, "globalListPrompt");
  }
};

export const configurePrompt = async (defaultConfig: QLUserInputtedConfig) => {
  try {
    const config = {
      userName: await input({
        message: "Enter your name: ",
        default: defaultConfig.userName,
        validate: async (value) => {
          const res = await z.string().safeParseAsync(value);

          return res.success ? res.success : res.error.issues[0].message;
        },
      }),
      dateFormat: await select({
        message: "Choose your preferred date format: ",
        choices: date_formats.map((value) => {
          return { value };
        }),
        default: defaultConfig.dateFormat,
      }),
    };

    return ok(config);
  } catch (error) {
    return handlePromptError(error, "configurePrompt");
  }
};
