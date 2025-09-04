import path from "path";
import { err, ok } from "neverthrow";

import { renameListFile, saveConfig, saveMetadata } from "@v2/lib/file-io";
import { getFormattedJSON } from "@v2/lib/helpers";
import logger, { DEBUG_HEX } from "@v2/lib/logger";
import {
  getUserChangeInConfig,
  selectPrompt,
  textPrompt,
} from "@v2/lib/prompt";
import {
  date_formats,
  priority_styles,
  sort_criteria,
  sort_orders,
} from "@v2/types";
import { QLCompleteConfig } from "@v2/types/config";
import { QLListOptions } from "@v2/types/list";

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
    useEditorForUpdates: config.useEditorForUpdatingText,
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
  configFilepath: string,
  metadata: QLListOptions,
  metadataFilepath: string,
) => {
  const publicDisplayedConfig = {
    listName: metadata.name,
    userName: config.userName,
    priorityStyle: metadata.priorityStyle,
    sortCriteria: metadata.sortCriteria,
    sortOrder: metadata.sortOrder,
    dateFormat: config.dateFormat,
    useEditorForUpdatingText: config.useEditorForUpdatingText,
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

  const config_options = ["userName", "dateFormat", "useEditorForUpdatingText"];

  const text_input_options = ["listName", "userName"];

  let updatedValue: typeof currentValue;

  if (text_input_options.includes(selectedOption)) {
    const inputRes = await textPrompt(
      `Enter the new value for '${selectedOption}': `,
      currentValue,
      config.useEditorForUpdatingText,
    );

    if (inputRes.isErr())
      return err({
        ...inputRes.error,
        location: `${inputRes.error.location} -> modifyConfig`,
      });

    updatedValue = inputRes.value;
    // } else if (selectedOption === "useEditorForUpdatingText") {
  } else {
    const choiceMapping = {
      priorityStyle: priority_styles,
      sortCriteria: sort_criteria,
      sortOrder: sort_orders,
      dateFormat: date_formats,
      useEditorForUpdatingText: ["Yes", "No"] as const,
    };

    const selectRes = await selectPrompt(
      `Select new value for '${selectedOption}': `,
      choiceMapping[selectedOption as keyof typeof choiceMapping],
      currentValue,
    );

    if (selectRes.isErr())
      return err({
        ...selectRes.error,
        location: `${selectRes.error.location} -> modifyConfig`,
      });
    updatedValue = selectRes.value;
  }

  if (config_options.includes(selectedOption)) {
    const updatedConfig =
      selectedOption === "useEditorForUpdatingText"
        ? {
          ...config,
          useEditorForUpdatingText: updatedValue === "Yes" ? true : false,
        }
        : { ...config, [selectedOption]: updatedValue };

    const saveConfigRes = saveConfig(updatedConfig, configFilepath);

    if (saveConfigRes.isErr())
      return err({
        ...saveConfigRes.error,
        location: `${saveConfigRes.error.location} -> modifyConfig`,
      });
  } else {
    if (selectedOption === "listName") {
      if (currentValue === "global") {
        logger.warn("Global list name cannot be changed.");
        return ok();
      }
      const currentDatasetFilepath = metadata.datasetFilepath;

      const updatedMetadata = {
        ...metadata,
        name: updatedValue,
        datasetFilepath: path.join(
          path.dirname(metadata.datasetFilepath),
          `${updatedValue}.json`,
        ),
      };

      const { [currentValue]: appDir, ...remainingLists } = config.lists;

      const updatedConfig = {
        ...config,
        lists: { ...remainingLists, [updatedValue]: appDir },
      };

      delete updatedConfig.lists[currentValue];

      const saveMetadataRes = saveMetadata(updatedMetadata, metadataFilepath);
      const saveConfigRes = saveConfig(updatedConfig, configFilepath);

      if (saveMetadataRes.isErr())
        return err({
          ...saveMetadataRes.error,
          location: `${saveMetadataRes.error.location} -> modifyConfig`,
        });
      else if (saveConfigRes.isErr())
        return err({
          ...saveConfigRes.error,
          location: `${saveConfigRes.error.location} -> modifyConfig`,
        });

      const renameRes = renameListFile(
        currentDatasetFilepath,
        updatedMetadata.datasetFilepath,
      );

      if (renameRes.isErr())
        return err({
          ...renameRes.error,
          location: `${renameRes.error.location} -> modifyConfig`,
        });
    } else {
      // just have to update the metadata file
      const updatedMetadata = { ...metadata, [selectedOption]: updatedValue };

      const saveMetadataRes = saveMetadata(updatedMetadata, metadataFilepath);

      if (saveMetadataRes.isErr())
        return err({
          ...saveMetadataRes.error,
          location: `${saveMetadataRes.error.location} -> modifyConfig`,
        });
    }
  }
  logger.info("Changed setting");

  return ok();
};
