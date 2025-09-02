import { Command } from "commander";
import * as path from "path";
import { err, ok } from "neverthrow";

import { initListPrompt } from "@v1/lib/prompt";
import { ListMetadata, ListOptions } from "@v1/types/list";
import {
  addToGitIgnore,
  createDir,
  saveConfig,
  saveData,
  saveMetadata,
} from "@v1/lib/file-io";
import logger from "@v1/lib/logger";
import { QLCompleteConfig } from "@v1/types/config";

export const initializeList = async (
  defaultListFlag: boolean,
  config: QLCompleteConfig,
  configFilepath: string,
) => {
  let finalListOptions: ListOptions;

  const currentDirpathStems = process.cwd().split(path.sep);

  const defaultListOptions: ListOptions = {
    listName: currentDirpathStems[currentDirpathStems.length - 1],
    appDir: path.join(process.cwd(), ".quiklist"),
    // deleteOnDone: false,
    priorityStyle: "none",

    // priority add-ons
    sortCriteria: "none",
    sortOrder: "descending",
  };

  if (!defaultListFlag) {
    const initListRes = await initListPrompt(defaultListOptions);

    if (initListRes.isErr()) {
      return err({
        ...initListRes.error,
        location: `${initListRes.error.location} -> initializeList`,
      });
    }

    finalListOptions = initListRes.value;
  } else finalListOptions = defaultListOptions;

  // create the app directory
  const createAppdirRes = createDir(finalListOptions.appDir);

  if (createAppdirRes.isErr())
    return err({
      ...createAppdirRes.error,
      location: `${createAppdirRes.error.location} -> initializeList`,
    });

  // create the metadata.json file
  const metadataFilepath = path.join(finalListOptions.appDir, "metadata.json");

  const listMetadata: ListMetadata = {
    name: finalListOptions.listName,
    dataFilepath: path.join(
      finalListOptions.appDir,
      `${finalListOptions.listName}.json`,
    ),
    // deleteOnDone: finalListOptions.deleteOnDone,
    priorityStyle: finalListOptions.priorityStyle,
    sortCriteria: finalListOptions.sortCriteria,
    sortOrder: finalListOptions.sortOrder,
  };

  const saveMetadataRes = saveMetadata(listMetadata, metadataFilepath);

  if (saveMetadataRes.isErr())
    return err({
      ...saveMetadataRes.error,
      location: saveMetadataRes.error.location,
    });

  // create the data file
  const saveDataRes = saveData([], listMetadata.dataFilepath);

  if (saveDataRes.isErr()) {
    return err({
      ...saveDataRes.error,
      location: saveDataRes.error.location,
    });
  }

  // update the config file with the mapping of this list and the dir
  const updatedConfig = {
    ...config,
    lists: { ...config.lists, [listMetadata.name]: finalListOptions.appDir },
  };

  const updateConfigRes = saveConfig(updatedConfig, configFilepath);

  if (updateConfigRes.isErr())
    return err({
      ...updateConfigRes.error,
      location: updateConfigRes.error.location,
    });

  const gitignoreRes = addToGitIgnore();

  if (gitignoreRes.isErr())
    return err({
      ...gitignoreRes.error,
      location: `${gitignoreRes.error.location} -> initListCommand`,
    });

  logger.info(`Created quiklist '${listMetadata.name}'!`);

  return ok();
};

const initListCommand = new Command("init")
  .description("Initialize a check-list for the current directory")
  .option("-y", "Use all default settings.", false);

export default initListCommand;
