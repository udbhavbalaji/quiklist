import { getFormattedJSON } from "@v2/lib/helpers";
import logger, { DEBUG_HEX } from "@v2/lib/logger";
import {
  getUserChangeInConfig,
  selectPrompt,
  textPrompt,
} from "@v2/lib/prompt";
import {
  date_formats,
  DateFormat,
  priority_styles,
  PriorityStyle,
  sort_criteria,
  sort_orders,
  SortCriteria,
  SortOrder,
} from "@v2/types";
import { ConfigSelectOptions, QLCompleteConfig } from "@v2/types/config";
import { QLListOptions } from "@v2/types/list";
import { err } from "neverthrow";

export const showConfig = (
  config: QLCompleteConfig,
  metadata: QLListOptions,
) => {
  const publicDisplayedConfig = {
    listName: metadata.name,
    createdBy: config.userName,
    priorityStyle: metadata.priorityStyle,
    sortCriteria: metadata.sortCriteria,
    sortOrder: metadata.sortOrder,
    dateFormat: config.dateFormat,
  };
  logger.hex(
    DEBUG_HEX,
    getFormattedJSON(
      metadata.name === "global"
        ? { ...publicDisplayedConfig, lists: Object.keys(config.lists) }
        : publicDisplayedConfig,
    ),
  );
};

export const modifyConfig = async (
  config: QLCompleteConfig,
  metadata: QLListOptions,
) => {
  const publicDisplayedConfig = {
    listName: metadata.name,
    userName: config.userName,
    priorityStyle: metadata.priorityStyle,
    sortCriteria: metadata.sortCriteria,
    sortOrder: metadata.sortOrder,
    dateFormat: config.dateFormat,
  };

  const userSelectedOptionToModify = await getUserChangeInConfig(
    publicDisplayedConfig,
  );

  if (userSelectedOptionToModify.isErr())
    return err({
      ...userSelectedOptionToModify.error,
      location: `${userSelectedOptionToModify.error.location} -> modifyConfig`,
    });

  const splitSetting = userSelectedOptionToModify.value.split(": ");
  const selectedOption = splitSetting[0];
  const currentValue = splitSetting[1];

  const metadata_options = [
    "listName",
    "priorityStyle",
    "sortCriteria",
    "sortOrder",
  ] as const;
  const config_options = ["createdBy", "dateFormat"] as const;

  const text_input_options = ["listName", "userName"];

  let updatedValue: typeof currentValue;

  if (text_input_options.includes(selectedOption)) {
    const inputRes = await textPrompt(
      `Enter the new value for '${selectedOption}': `,
      currentValue,
    );

    if (inputRes.isErr())
      return err({
        ...inputRes.error,
        location: `${inputRes.error.location} -> modifyConfig`,
      });

    updatedValue = inputRes.value;
  } else {
    let choices: ConfigSelectOptions;
    switch (selectedOption) {
      case "priorityStyle": {
        choices = priority_styles;
        break;
      }
      case "sortCriteria": {
        choices = sort_criteria;
        break;
      }
      case "sortOrder": {
        choices = sort_orders;
      }
      case "dateFormat": {
        choices = date_formats;
      }
      default: {
        return err({
          message: "trying to change an option that doesn't exist lol",
          location: "modifyConfig",
        });
      }
    }

    const selectRes = await selectPrompt(
      `Select new value for '${selectedOption}': `,
      choices,
      currentValue,
    );

    if (selectRes.isErr())
      return err({
        ...selectRes.error,
        location: `${selectRes.error.location} -> modifyConfig`,
      });
    updatedValue = selectRes.value;
  }
};
