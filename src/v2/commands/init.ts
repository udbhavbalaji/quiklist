// External imports
import { err, ok } from "neverthrow";
import path from "path";
import os from "os";

// Internal imports
import { createDir, saveConfig, saveList, saveMetadata } from "@v2/lib/file-io";
import { QLCompleteConfig, QLUserInputtedConfig } from "@v2/types/config";
// import { configurePrompt, globalListPrompt } from "@v2/lib/prompt";
import { QLGlobalListOptions, QLList, QLListMetadata } from "@v2/types/list";
import logger from "@v2/lib/logger";
import {
  getGlobalListOptionsPrompt,
  getQuiklistConfigPrompt,
} from "@v2/lib/prompt";

// module-level vars
const globalAppDir = path.join(os.homedir(), ".quiklist");

// function that handles the process of initializing quiklist for use when first installed, creates config and global list
const initGlobalConfig = async (configFilepath: string) => {
  const ensureDirExists = createDir(path.dirname(configFilepath));

  if (ensureDirExists.isErr())
    return err({
      ...ensureDirExists.error,
      location: `${ensureDirExists.error.location} -> initGlobalConfig`,
    });

  const defaultConfig: QLUserInputtedConfig = {
    userName: "John Doe",
    dateFormat: "DD-MM-YYYY",
    useEditorForUpdatingText: false,
  };

  const configRes = await getQuiklistConfigPrompt(defaultConfig);
  // const configRes = await configurePrompt(defaultConfig);

  if (configRes.isErr())
    return err({
      ...configRes.error,
      location: `${configRes.error.location} -> initGlobalConfig`,
    });

  const finalConfig: QLCompleteConfig = {
    ...configRes.value,
    lists: {
      global: globalAppDir,
    },
  };

  const defaultGlobalListOptions: QLGlobalListOptions = {
    priorityStyle: "!/!!/!!!",
    sortCriteria: "none",
    sortOrder: "descending",
  };

  const globalListOptionRes = await getGlobalListOptionsPrompt(
    defaultGlobalListOptions,
  );
  // const globalListOptionRes = await globalListPrompt(defaultGlobalListOptions);

  if (globalListOptionRes.isErr())
    return err({
      ...globalListOptionRes.error,
      location: `${globalListOptionRes.error.location} -> initGlobalConfig`,
    });

  const globalListMetadata: QLListMetadata = {
    ...globalListOptionRes.value,
    datasetFilepath: path.join(globalAppDir, "global.json"),
    name: "global",
  };

  const saveConfigRes = saveConfig(finalConfig, configFilepath);

  if (saveConfigRes.isErr())
    return err({
      ...saveConfigRes.error,
      location: `${saveConfigRes.error.location} -> initGlobalConfig`,
    });

  const createAppDir = createDir(globalAppDir);

  if (createAppDir.isErr())
    return err({
      ...createAppDir.error,
      location: `${createAppDir.error.location} -> initGlobalConfig`,
    });

  const saveMetadataRes = saveMetadata(
    globalListMetadata,
    path.join(globalAppDir, "metadata.json"),
  );

  if (saveMetadataRes.isErr())
    return err({
      ...saveMetadataRes.error,
      location: `${saveMetadataRes.error.location} -> initGlobalConfig`,
    });

  const newList: QLList = {
    checked: [],
    unchecked: [],
  };

  const saveListRes = saveList(newList, globalListMetadata.datasetFilepath);

  if (saveListRes.isErr())
    return err({
      ...saveListRes.error,
      location: `${saveListRes.error.location} -> initGlobalConfig`,
    });

  logger.info(
    "Quiklist has now been configured! Use [quiklist|ql] --help to get started.",
  );

  return ok();
};

export default initGlobalConfig;
