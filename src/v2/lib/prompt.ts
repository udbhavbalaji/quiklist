// External imports
import z from "zod";
import { err, ok } from "neverthrow";
import { input, select, confirm, editor } from "@inquirer/prompts";
import chalk from "chalk";
import actionSelect, { Action } from "inquirer-honshin-select";
import { select as multiSelect, Separator } from "inquirer-select-pro";

// Internal imports
import { QLUserInputtedConfig } from "@v2/types/config";
import {
  date_formats,
  DateFormat,
  priority_styles,
  PriorityStyle,
  sort_criteria,
  sort_orders,
} from "@v2/types";
import {
  QLGlobalListOptions,
  QLListBasicOptions,
  QLListItem,
  QLListOption,
  QLPublicListConfig,
  priorities,
} from "@v2/types/list";
import { handlePromptError } from "@v2/lib/handle-error";
import { pathValidator } from "@v2/lib/validator";
import { formatDateFromISO, getFormattedItem } from "@v2/lib/helpers";
import logger, { INFO_HEX, PANIC_HEX } from "@v2/lib/logger";
import { configCommand } from "@v2/commands";
import {
  ActionSelectPromptArgs,
  ConfirmPromptArgs,
  MultiSelectPromptArgs,
  SingleSelectPromptArgs,
  TextPromptArgs,
  TextPromptConfig,
} from "@v2/types/prompt";
import { da } from "zod/v4/locales/index.cjs";

const constructListOptions = (
  itemOptions: Record<"checked" | "unchecked", QLListOption[]>,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  return [
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
};

export const getTextPrompt = async ({
  message,
  required = false,
  useEditor = false,
  prefill = "tab",
  default: defaultValue,
  validate,
}: TextPromptArgs) => {
  try {
    const textConfig: TextPromptConfig = {
      message: message,
    };

    if (defaultValue) textConfig.default = defaultValue;

    if (validate) textConfig.validate = validate;

    const answer = useEditor
      ? await editor({ ...textConfig, waitForUseInput: true })
      : await input({ ...textConfig, required, prefill });
    return ok(answer.trim());
  } catch (error) {
    return handlePromptError(error, "getTextPrompt");
  }
};

export const getSingleSelectPrompt = async <T>({
  message,
  choices,
  default: defaultValue,
}: SingleSelectPromptArgs<T>) => {
  try {
    const answer = await select({
      message,
      default: defaultValue,
      choices: choices.map((value) => {
        return { value };
      }),
      pageSize: 20,
      loop: false,
    });
    return ok(answer);
  } catch (error) {
    return handlePromptError(error, "getSingleSelectPrompt");
  }
};

const getMultiSelectPrompt = async <
  T extends Record<"value" | "name", string>,
>({
  message,
  options,
  default: defaultValue = [],
  theme = {},
}: MultiSelectPromptArgs<T>) => {
  try {
    const answers = await multiSelect({
      message,
      options: options.map((item) => {
        if (typeof item === "string") return new Separator(item);
        return { value: item.value, name: item.name };
      }),
      defaultValue,
      pageSize: 20,
      multiple: true,
      theme,
    });
    return ok(answers);
  } catch (error) {
    return handlePromptError(error, "getMultiSelectPrompt");
  }
};

const getActionSelectPrompt = async <
  T extends Record<"value" | "name", string>,
  ActionValue,
>({
  message,
  choices,
  actions,
  default: defaultValue,
}: ActionSelectPromptArgs<T, ActionValue>) => {
  try {
    const { action, answer } = await actionSelect({
      message,
      default: defaultValue,
      choices: choices.map((item) => {
        if (typeof item === "string") return new Separator(item);
        return { value: item.value, name: item.name };
      }),
      actions,
      loop: false,
      pageSize: 20,
    });
    return ok({ answer, action });
  } catch (error) {
    return handlePromptError(error, "getActionSelectPrompt");
  }
};

export const getConfirmPrompt = async ({
  message,
  default: defaultValue,
}: ConfirmPromptArgs) => {
  try {
    const confirmed = await confirm({ message, default: defaultValue });
    return ok(confirmed);
  } catch (error) {
    return handlePromptError(error, "getConfirmSelectPrompt");
  }
};

///////// Re writen Prompt Fns ////////////////////

export const userConfigChangePrompt = async (
  listConfig: QLPublicListConfig,
) => {
  const configOptions = Object.entries(listConfig);

  const choices = configOptions.map((item) => `${item[0]}: ${item[1]}`);

  const promptRes = await getSingleSelectPrompt({
    message: "Select the setting you want to change: ",
    choices,
  });

  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> userConfigChangePrompt`,
    });

  return promptRes;
};

export const itemDescriptionPrompt = async (message: string) => {
  const promptRes = await getTextPrompt({
    message,
    useEditor: false,
    required: true,
    validate: (value) =>
      value === "" ? "Item description cannot be empty" : true,
  });

  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> itemDescriptionPrompt`,
    });

  return promptRes;
};

export const createNewListPrompt = async (
  defaultListOptions: QLGlobalListOptions & QLListBasicOptions,
) => {
  const nameRes = await getTextPrompt({
    message: "Name of the list: ",
    default: defaultListOptions.name,
  });
  if (nameRes.isErr())
    return err({
      ...nameRes.error,
      location: `${nameRes.error.location} -> createNewListPrompt:name`,
    });

  const appDirRes = await getTextPrompt({
    message: "Where do you want your list data stored? ",
    default: defaultListOptions.appDir,
    validate: pathValidator,
  });
  if (appDirRes.isErr())
    return err({
      ...appDirRes.error,
      location: `${appDirRes.error.location} -> createNewListPrompt:appDir`,
    });

  const otherListOptionsRes = await getGlobalListOptionsPrompt({
    priorityStyle: defaultListOptions.priorityStyle,
    sortCriteria: defaultListOptions.sortCriteria,
    sortOrder: defaultListOptions.sortOrder,
  });

  if (otherListOptionsRes.isErr())
    return err({
      ...otherListOptionsRes.error,
      location: `${otherListOptionsRes.error.location} -> createNewListPrompt`,
    });

  const { priorityStyle, sortCriteria, sortOrder } = otherListOptionsRes.value;

  return ok({
    name: nameRes.value,
    appDir: appDirRes.value,
    priorityStyle: priorityStyle,
    sortCriteria: sortCriteria,
    sortOrder: sortOrder,
  });
};

export const deleteListItemsPrompt = async (
  itemOptions: Record<"checked" | "unchecked", QLListOption[]>,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  const options = constructListOptions(itemOptions, dateFormat, priorityStyle);
  // const options = [
  //   chalk.hex(PANIC_HEX).bold("\n -- TODO -- "),
  //   ...itemOptions.unchecked.map((item) => {
  //     const { id, ...mainItem } = item;
  //     return {
  //       value: id,
  //       name: chalk
  //         .hex(PANIC_HEX)
  //         .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
  //     };
  //   }),
  //   chalk.hex(INFO_HEX).bold("\n -- COMPLETED -- "),
  //   ...itemOptions.checked.map((item) => {
  //     const { id, ...mainItem } = item;
  //     return {
  //       value: id,
  //       name: chalk
  //         .hex(INFO_HEX)
  //         .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
  //     };
  //   }),
  // ];

  const deletedItemsRes = await getMultiSelectPrompt({
    message: "Select the items you want to delete: ",
    options,
    theme: {
      icon: {
        checked: "[✘]",
      },
    },
  });

  if (deletedItemsRes.isErr())
    return err({
      ...deletedItemsRes.error,
      location: `${deletedItemsRes.error.location} -> deleteListItemsPrompt:select`,
    });

  if (deletedItemsRes.value.length > 0) {
    const confirmedRes = await getConfirmPrompt({
      message:
        "Are you sure you want to delete these items? Note: This CANNOT be undone.",
      default: true,
    });

    if (confirmedRes.isErr())
      return err({
        ...confirmedRes.error,
        location: `${confirmedRes.error.location} -> deleteListItemsPrompt:confirm`,
      });

    if (!confirmedRes.value) return ok([]);
  }
  return ok(deletedItemsRes.value);
};

export const getUpdatedDeadlinePrompt = async (
  item: QLListOption,
  dateFormat: DateFormat,
) => {
  const promptRes = await getTextPrompt({
    message: "Enter updated deadline: ",
    default: item.deadline
      ? formatDateFromISO(item.deadline, dateFormat)
      : formatDateFromISO(new Date().toISOString(), dateFormat),
    prefill: "editable",
  });

  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> getUpdatedDeadlinePrompt`,
    });

  return promptRes;
};

export const getUpdatePriorityPrompt = async (item: QLListOption) => {
  const promptRes = await getSingleSelectPrompt({
    message: "Choose updated priority: ",
    default: item.priority,
    choices: priorities,
  });

  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> getUpdatePriorityPrompt`,
    });

  return promptRes;
};

export const getUpdatedDescriptionPrompt = async (
  item: QLListOption,
  useEditor: boolean,
) => {
  const promptRes = await getTextPrompt({
    message: "Enter updated item description: ",
    default: item.description,
    useEditor,
    prefill: "editable",
    validate: (desc) =>
      desc === "" ? "Item description cannot be empty" : true,
  });

  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> getUpdateDescriptionPrompt`,
    });

  return promptRes;
};

export const getItemToEditPrompt = async (
  itemOptions: Record<"unchecked" | "checked", QLListOption[]>,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  const choices = constructListOptions(itemOptions, dateFormat, priorityStyle);
  // const choices = [
  //   chalk.hex(PANIC_HEX).bold("\n -- TODO -- "),
  //   ...itemOptions.unchecked.map((item) => {
  //     const { id, ...mainItem } = item;
  //     return {
  //       value: id,
  //       name: chalk
  //         .hex(PANIC_HEX)
  //         .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
  //     };
  //   }),
  //   chalk.hex(INFO_HEX).bold("\n -- COMPLETED -- "),
  //   ...itemOptions.checked.map((item) => {
  //     const { id, ...mainItem } = item;
  //     return {
  //       value: id,
  //       name: chalk
  //         .hex(INFO_HEX)
  //         .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
  //       checked: true,
  //     };
  //   }),
  // ];

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

  const promptRes = await getActionSelectPrompt({
    message: "Hover on an item and choose an action: ",
    choices,
    actions,
  });
  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> getItemToEditPrompt`,
    });

  return promptRes;
};

export const getMarkedItemsPrompt = async (
  itemOptions: Record<"checked" | "unchecked", QLListOption[]>,
  dateFormat: DateFormat,
  priorityStyle: PriorityStyle,
) => {
  const options = constructListOptions(itemOptions, dateFormat, priorityStyle);
  // const options = [
  //   chalk.hex(PANIC_HEX).bold("\n -- TODO -- "),
  //   ...itemOptions.unchecked.map((item) => {
  //     const { id, ...mainItem } = item;
  //     return {
  //       value: id,
  //       name: chalk
  //         .hex(PANIC_HEX)
  //         .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
  //     };
  //   }),
  //   chalk.hex(INFO_HEX).bold("\n -- COMPLETED -- "),
  //   ...itemOptions.checked.map((item) => {
  //     const { id, ...mainItem } = item;
  //     return {
  //       value: id,
  //       name: chalk
  //         .hex(INFO_HEX)
  //         .bold(getFormattedItem(mainItem, dateFormat, priorityStyle, true)),
  //     };
  //   }),
  // ];

  const originalSelectedItems = itemOptions.checked.map((item) => item.id);

  const promptRes = await getMultiSelectPrompt({
    message: "Mark/unmark your items: ",
    options,
    default: originalSelectedItems,
  });

  if (promptRes.isErr())
    return err({
      ...promptRes.error,
      location: `${promptRes.error.location} -> getMarkedItemsPrompt`,
    });

  const selectedItems = promptRes.value;

  const removed = originalSelectedItems.filter(
    (item) => !selectedItems.includes(item),
  );
  const added = selectedItems.filter(
    (item) => !originalSelectedItems.includes(item),
  );

  return ok({ removed, added });
};

export const getGlobalListOptionsPrompt = async (
  defaultGlobalListOptions: QLGlobalListOptions,
) => {
  const priorityStyleRes = await getSingleSelectPrompt({
    message: "Select your preferred style for displaying priority",
    default: defaultGlobalListOptions.priorityStyle,
    choices: priority_styles,
  });
  if (priorityStyleRes.isErr())
    return err({
      ...priorityStyleRes.error,
      location: `${priorityStyleRes.error.location} -> getGlobalListOptionsPrompt:priorityStyle`,
    });

  const sortCriteriaRes = await getSingleSelectPrompt({
    message: "On what basis do you want your items sorted? ",
    default: defaultGlobalListOptions.sortCriteria,
    choices: sort_criteria,
  });
  if (sortCriteriaRes.isErr())
    return err({
      ...sortCriteriaRes.error,
      location: `${sortCriteriaRes.error.location} -> getGlobalListOptionsPrompt:sortCriteria`,
    });

  const sortOrderRes =
    sortCriteriaRes.value !== "none"
      ? await getSingleSelectPrompt({
        message: "Sort ordering: ",
        default: defaultGlobalListOptions.sortOrder,
        choices: sort_orders,
      })
      : ok(defaultGlobalListOptions.sortOrder);
  if (sortOrderRes.isErr())
    return err({
      ...sortOrderRes.error,
      location: `${sortOrderRes.error.location} -> getGlobalListOptionsPrompt:sortOrder`,
    });

  return ok({
    priorityStyle: priorityStyleRes.value,
    sortCriteria: sortCriteriaRes.value,
    sortOrder: sortOrderRes.value,
  });
};

export const getQuiklistConfigPrompt = async (
  defaultConfig: QLUserInputtedConfig,
) => {
  const userNameRes = await getTextPrompt({
    message: "Enter your name: ",
    default: defaultConfig.userName,
    validate: (value) => (value === "" ? "Name cannot be empty" : true),
  });

  if (userNameRes.isErr())
    return err({
      ...userNameRes.error,
      location: `${userNameRes.error.location} -> getQuiklistConfigPrompt:userName`,
    });

  const dateFormatRes = await getSingleSelectPrompt({
    message: "Choose your preferred date format: ",
    default: defaultConfig.dateFormat,
    choices: date_formats,
  });

  if (dateFormatRes.isErr())
    return err({
      ...dateFormatRes.error,
      location: `${dateFormatRes.error.location} -> getQuiklistConfigPrompt:dateFormat`,
    });

  const useEditorRes = await getConfirmPrompt({
    message: "Do you want to open up your preferred editor for making changes?",
    default: defaultConfig.useEditorForUpdatingText,
  });

  if (useEditorRes.isErr())
    return err({
      ...useEditorRes.error,
      location: `${useEditorRes.error.location} -> getQuiklistConfigPrompt:useEditor`,
    });

  return ok({
    userName: userNameRes.value,
    dateFormat: dateFormatRes.value,
    useEditorForUpdatingText: useEditorRes.value,
  });
};
