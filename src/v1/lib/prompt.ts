import { err, ok } from "neverthrow";
import { select as multiSelect, Separator } from "inquirer-select-pro";
import { default as tgl } from "inquirer-toggle";
import newActionSelect from "inquirer-honshin-select";

import { input, select, confirm, editor } from "@inquirer/prompts";
import { LogLevel } from "@v1/types/logger";
import logger from "@v1/lib/logger";
import { QLUserInputtedConfig } from "@v1/types/config";
import { date_formats, DateFormat } from "@v1/types";
import {
  InternalListOption,
  ListOptions,
  priorities,
  sort_criteria,
  sort_orders,
} from "@v1/types/list";
import { pathValidator } from "@v1/lib/validator";
import { priority_styles } from "@v1/types/list";
import { renderDate } from "@v1/lib/render";
import { errorHandler } from "@v1/lib/error-handle";

// @ts-ignore - only works this way: https://github.com/skarahoda/inquirer-toggle/issues/3
const toggle = tgl.default;

const handlePromptError = (error: any, fnName: string) => {
  if (
    error instanceof Error &&
    (error.name === "ExitPromptError" ||
      error.message === "User force closed the prompt with 0 null")
  ) {
    logger.error("Operation terminated.");
    process.exit(1);
  } else {
    return err({
      message: (error as Error).message,
      location: fnName,
      messageLevel: "error" as LogLevel,
    });
  }
};

export const confirmPrompt = async (message: string) => {
  try {
    const confirmed = await confirm({ message, default: true });
    return ok(confirmed);
  } catch (error) {
    return handlePromptError(error, "confirmPrompt");
  }
};

export const itemTextPrompt = async () => {
  try {
    const itemText = await input({
      message: "Enter the item description: ",
      validate: (value) =>
        value.length > 0 ? true : "Description cannot be empty",
    });
    return ok(itemText);
  } catch (error) {
    return handlePromptError(error, "itemTextPrompt");
  }
};

export const itemsPrompt = async (
  checkedItemOptions: InternalListOption[],
  uncheckedItemOptions: InternalListOption[],
  message: string,
  confirmSelection: boolean,
  confirmDelete: boolean,
  promptType: "delete" | "mark",
) => {
  const options: ({ value: string; name: string } | string)[] = [
    " -- TODO --",
    ...uncheckedItemOptions.map((item) => {
      return { value: item.id, name: item.item };
    }),
    " -- COMPLETED --",
    ...checkedItemOptions.map((item) => {
      return {
        value: item.id,
        name: item.item,
        checked: promptType === "mark" ? true : undefined,
      };
    }),
  ];

  let abort = false;

  try {
    let selectedItems = await multiSelect({
      message,
      options: options.map((item) => {
        if (typeof item === "string") return new Separator(item);
        return item;
      }),
      confirmDelete,
      multiple: true,
      defaultValue:
        promptType === "mark"
          ? checkedItemOptions.map((item) => item.id)
          : undefined,
      theme:
        promptType === "mark"
          ? {}
          : {
            icon: {
              checked: "[✘]",
            },
          },
    });

    if (confirmSelection && selectedItems.length > 0) {
      const confirmed = await toggle({
        message:
          promptType === "delete"
            ? "Are you sure you want to delete the selected items?"
            : "Confirm?",
        default: true,
      });
      if (!confirmed) {
        abort = true;
      }
    }

    if (abort) {
      selectedItems = [];
    }

    return ok(selectedItems);
  } catch (error) {
    return handlePromptError(error, "itemsPrompt");
  }
};

// todo: need to handle edge case where user returns empty string
export const getUpdatedItemDeadline = async (
  item: InternalListOption,
  dateFormat: DateFormat,
) => {
  try {
    const answer = await input({
      message: "Enter updated deadline: ",
      default: item.deadline
        ? errorHandler(renderDate(item.deadline, dateFormat))
        : errorHandler(renderDate(new Date().toISOString(), dateFormat)),
      prefill: "editable",
    });
    return ok(answer);
  } catch (error) {
    return handlePromptError(error, "getUpdatedItemDeadline");
  }
};

export const getUpdatedItemPriority = async (item: InternalListOption) => {
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

export const getUpdatedItemText = async (item: InternalListOption) => {
  try {
    const answer = await editor({
      message: "Make changes to the item",
      default: item.item,
    });
    if (answer === "") {
      logger.error(
        "Cannot remove entire text content from item. You can delete this item using the 'delete' command",
      );
      return ok(item.item);
    }
    return ok(answer.trim());
  } catch (error) {
    return handlePromptError(error, "getUpdatedItemText");
  }
};

export const editItemPrompt = async (
  checkedItemOptions: InternalListOption[],
  uncheckedItemOptions: InternalListOption[],
) => {
  const options: ({ value: string; name: string } | string)[] = [
    " -- TODO --",
    ...uncheckedItemOptions.map((item) => {
      return { value: item.id, name: item.item };
    }),
    " -- COMPLETED --",
    ...checkedItemOptions.map((item) => {
      return {
        value: item.id,
        name: item.item,
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
    const answer = await newActionSelect({
      message: "Choose item and select an action:",
      actions: actions,
      choices: options.map((option) =>
        typeof option === "string" ? new Separator(option) : option,
      ),
    });
    return ok(answer);
  } catch (error) {
    return handlePromptError(error, "editItemPrompt");
  }
};

// todo: need to add prompt for getting user config for sorting
export const initListPrompt = async (defaultListOptions: ListOptions) => {
  try {
    const listName = await input({
      message: "Your list's name: ",
      default: defaultListOptions.listName,
    });

    const appDir = await input({
      message: "Here's where your list data is stored: ",
      default: defaultListOptions.appDir,
      validate: pathValidator,
    });

    // deprecated
    // const deleteOnDone = await confirm({
    //   message: "Should we delete items as you're done with them?",
    //   default: defaultListOptions.deleteOnDone,
    // });

    const priorityStyle = await select({
      message: "How do you want the priorities displayed? ",
      choices: priority_styles.map((value) => {
        return { value };
      }),
      default: defaultListOptions.priorityStyle,
    });

    const sortCriteria = await select({
      message: "How do you want your items sorted? ",
      choices: sort_criteria.map((value) => {
        return { value };
      }),
      default: defaultListOptions.sortCriteria,
    });

    const sortOrder =
      sortCriteria !== "none"
        ? await select({
          message: "In what order do you want your items sorted? ",
          choices: sort_orders.map((value) => {
            return { value };
          }),
          default: defaultListOptions.sortOrder,
        })
        : defaultListOptions.sortOrder;

    return ok({
      listName,
      appDir,
      // deleteOnDone,
      priorityStyle,
      sortCriteria,
      sortOrder,
    });
  } catch (error) {
    return handlePromptError(error, "initListPrompt");
  }
};

export const configurePrompt = async (defaultConfig: QLUserInputtedConfig) => {
  try {
    const answers = {
      userName: await input({
        message: "Enter your name: ",
        default: defaultConfig.userName,
        required: true,
      }),
      dateFormat: await select({
        message: "Select your preferred date format: ",
        choices: date_formats.map((value) => {
          return { value };
        }),
        default: defaultConfig.dateFormat,
      }),
    };
    return ok(answers);
  } catch (error) {
    return handlePromptError(error, "configurePrompt");
  }
};
