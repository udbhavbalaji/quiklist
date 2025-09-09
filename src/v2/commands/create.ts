// External imports
import path from "path";
import { err, ok } from "neverthrow";

// Internal imports
import { QLCompleteConfig } from "@v2/types/config";
import {
  QLGlobalListOptions,
  QLList,
  QLListBasicOptions,
  QLListMetadata,
} from "@v2/types/list";
import {
  createNewListPrompt,
  getConfirmPrompt,
  getGlobalListOptionsPrompt,
} from "@v2/lib/prompt";
import {
  addToGitIgnore,
  createDir,
  saveConfig,
  saveList,
  saveMetadata,
} from "@v2/lib/file-io";
import logger from "@v2/lib/logger";

// function that creates a new quiklist in the current working directory, going through prompts as well
const createList = async (
  defaultFlag: boolean,
  config: QLCompleteConfig,
  configFilepath: string,
  globalMetadata: QLListMetadata,
) => {
  const currentDirpathStems = process.cwd().split(path.sep);

  const defaultListOptions: QLGlobalListOptions & QLListBasicOptions = {
    name: currentDirpathStems[currentDirpathStems.length - 1],
    appDir: path.join(process.cwd(), ".quiklist"),
    priorityStyle: globalMetadata.priorityStyle,
    sortCriteria: globalMetadata.sortCriteria,
    sortOrder: globalMetadata.sortOrder,
  };

  let chosenListOptions: QLGlobalListOptions & QLListBasicOptions;

  if (!defaultFlag) {
    const createListPromptRes = await createNewListPrompt(defaultListOptions);
    // const createListPromptRes = await createListPrompt(defaultListOptions);

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

  const listMetadata: QLListMetadata = {
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

  const userWantsListTracked = await getConfirmPrompt({
    message: `Do you want to track '${listMetadata.name}' through git? (If not, quiklist's directory will be added to .gitignore)`,
    default: false,
  });
  // const userWantsListTracked = await confirmPrompt(
  //   `Do you want to track '${listMetadata.name}' through git? (If not, quiklist's directory will be added to .gitignore)`,
  // );

  if (userWantsListTracked.isErr())
    return err({
      ...userWantsListTracked.error,
      location: `${userWantsListTracked.error.location} -> createList`,
    });

  const pathToIgnore = userWantsListTracked.value
    ? ".quiklist/metadata.json"
    : ".quiklist/";

  const gitignoreRes = addToGitIgnore(pathToIgnore);

  if (gitignoreRes.isErr())
    return err({
      ...gitignoreRes.error,
      location: `${gitignoreRes.error.location} -> createList`,
    });

  logger.info(`Created list '${listMetadata.name}'`);

  return ok();
};

export const syncList = async (
  existingListInfo: QLListBasicOptions,
  globalMetadata: QLListMetadata,
  config: QLCompleteConfig,
  configFilepath: string,
) => {
  const defaultListOptions: QLGlobalListOptions = {
    priorityStyle: globalMetadata.priorityStyle,
    sortCriteria: globalMetadata.sortCriteria,
    sortOrder: globalMetadata.sortOrder,
  };

  const listOptionsRes = await getGlobalListOptionsPrompt(defaultListOptions);
  // const listOptionsRes = await globalListPrompt(defaultListOptions);

  if (listOptionsRes.isErr())
    return err({
      ...listOptionsRes.error,
      location: `${listOptionsRes.error.location} -> syncList`,
    });

  const syncedListMetadata: QLListMetadata = {
    ...listOptionsRes.value,
    name: existingListInfo.name,
    datasetFilepath: path.join(
      existingListInfo.appDir,
      `${existingListInfo.name}.json`,
    ),
  };

  const saveMetadataRes = saveMetadata(
    syncedListMetadata,
    path.join(existingListInfo.appDir, "metadata.json"),
  );

  if (saveMetadataRes.isErr())
    return err({
      ...saveMetadataRes.error,
      location: `${saveMetadataRes.error.location} -> syncList`,
    });

  const updatedConfig = {
    ...config,
    lists: {
      ...config.lists,
      [existingListInfo.name]: existingListInfo.appDir,
    },
  };

  const saveConfigRes = saveConfig(updatedConfig, configFilepath);

  if (saveConfigRes.isErr())
    return err({
      ...saveConfigRes.error,
      location: `${saveConfigRes.error.location} -> syncList`,
    });

  logger.info(
    `'${syncedListMetadata.name}' has been created from detected quiklist.`,
  );

  return ok();
};

export default createList;
