import path from "path";

import { QLCompleteConfig } from "@v2/types/config";
import {
  QLGlobalListOptions,
  QLList,
  QLListBasicOptions,
  QLListOptions,
} from "@v2/types/list";
import { createListPrompt } from "@v2/lib/prompt";
import { err, ok } from "neverthrow";
import {
  addToGitIgnore,
  createDir,
  saveConfig,
  saveList,
  saveMetadata,
} from "@v2/lib/file-io";
import logger from "@/lib/logger";

const createList = async (
  defaultFlag: boolean,
  config: QLCompleteConfig,
  configFilepath: string,
) => {
  const currentDirpathStems = process.cwd().split(path.sep);

  const defaultListOptions: QLGlobalListOptions & QLListBasicOptions = {
    name: currentDirpathStems[currentDirpathStems.length - 1],
    appDir: path.join(process.cwd(), ".quiklistv2"),
    priorityStyle: "none",
    sortCriteria: "none",
    sortOrder: "ascending",
  };

  let chosenListOptions: QLGlobalListOptions & QLListBasicOptions;

  if (!defaultFlag) {
    const createListPromptRes = await createListPrompt(defaultListOptions);

    if (createListPromptRes.isErr())
      return err({
        ...createListPromptRes.error,
        location: `${createListPromptRes.error.location} -> createList`,
      });

    chosenListOptions = createListPromptRes.value;
  } else chosenListOptions = defaultListOptions;

  const createAppDirRes = createDir(chosenListOptions.appDir);

  if (createAppDirRes.isErr())
    return err({
      ...createAppDirRes.error,
      location: `${createAppDirRes.error.location} -> createList`,
    });

  const metadataFilepath = path.join(chosenListOptions.appDir, "metadata.json");

  const listMetadata: QLListOptions = {
    name: chosenListOptions.name,
    datasetFilepath: path.join(
      chosenListOptions.appDir,
      `${chosenListOptions.name}.json`,
    ),
    priorityStyle: chosenListOptions.priorityStyle,
    sortCriteria: chosenListOptions.sortCriteria,
    sortOrder: chosenListOptions.sortOrder,
  };

  const saveMetadataRes = saveMetadata(listMetadata, metadataFilepath);

  if (saveMetadataRes.isErr())
    return err({
      ...saveMetadataRes.error,
      location: `${saveMetadataRes.error.location} -> createList`,
    });

  const emptyList: QLList = {
    checked: [],
    unchecked: [],
  };

  const saveListRes = saveList(emptyList, listMetadata.datasetFilepath);

  if (saveListRes.isErr())
    return err({
      ...saveListRes.error,
      location: `${saveListRes.error.location} -> createList`,
    });

  const updatedConfig = {
    ...config,
    lists: { ...config.lists, [listMetadata.name]: chosenListOptions.appDir },
  };

  const saveConfigRes = saveConfig(updatedConfig, configFilepath);

  if (saveConfigRes.isErr())
    return err({
      ...saveConfigRes.error,
      location: `${saveConfigRes.error.location} -> createList`,
    });

  const gitignoreRes = addToGitIgnore();

  if (gitignoreRes.isErr())
    return err({
      ...gitignoreRes.error,
      location: `${gitignoreRes.error.location} -> createList`,
    });

  logger.info(`Created list '${listMetadata.name}'`);

  return ok();
};

export default createList;
