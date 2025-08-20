import { err, ok } from "neverthrow";
import { QLCompleteConfig, QLUserInputtedConfig } from "../types/config";
import { configurePrompt } from "./prompt";
import { createDir, saveConfig } from "./file-io";
import logger from "./logger";
import * as path from "path";

export const initGlobalConfig = async (configFilepath: string) => {
  const ensureConfigDirExists = createDir(path.dirname(configFilepath));

  if (ensureConfigDirExists.isErr())
    return err({
      ...ensureConfigDirExists.error,
      location: `${ensureConfigDirExists.error.location} -> initGlobalConfig`,
    });

  let chosenConfig: QLUserInputtedConfig;

  const defaultConfig: QLUserInputtedConfig = {
    userName: "John Doe",
    dateFormat: "DD-MM-YYYY",
  };

  const configResult = await configurePrompt(defaultConfig);

  if (configResult.isErr())
    return err({
      ...configResult.error,
      location: `${configResult.error.location} -> configureApp`,
    });

  chosenConfig = configResult.value;

  const finalConfig: QLCompleteConfig = {
    ...chosenConfig,
    lists: {},
  };

  const saveConfigResult = saveConfig(finalConfig, configFilepath);

  if (saveConfigResult.isErr()) {
    return err({
      ...saveConfigResult.error,
      location: `${saveConfigResult.error.location} -> configureApp`,
    });
  }
  //
  // const createAppDirResult = createDir(finalConfig.appDir);
  //
  // if (createAppDirResult.isErr()) {
  //   return err({
  //     ...createAppDirResult.error,
  //     location: `${createAppDirResult.error.location} -> configureApp`,
  //   });
  // }

  logger.info(
    "Quiktrack configuration complete! Use quiktrack [-h|--help] to view available commands and options.",
  );

  return ok();
};
