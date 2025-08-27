import { loadMetadata, removeDir, saveConfig } from "@/lib/file-io";
import { QLCompleteConfig } from "@/types/config";
import { Command } from "commander";
import { err, ok } from "neverthrow";
import { errorHandler } from "@/lib/error-handle";
import logger from "@/lib/logger";

export const deleteList = async (
  metadataFilepath: string,
  config: QLCompleteConfig,
  configFilepath: string,
) => {
  const { name } = errorHandler(loadMetadata(metadataFilepath));

  const { [name]: appDir, ...remainingLists } = config.lists;

  const deleteDirRes = removeDir(appDir);

  if (deleteDirRes.isErr())
    return err({
      ...deleteDirRes.error,
      location: `${deleteDirRes.error.location} -> deleteList`,
    });

  const updatedConfig = {
    ...config,
    lists: remainingLists,
  };

  const saveConfigRes = saveConfig(updatedConfig, configFilepath);

  if (saveConfigRes.isErr())
    return err({
      ...saveConfigRes.error,
      location: `${saveConfigRes.error.location} -> deleteList`,
    });

  logger.info(`List '${name}' has been deleted!`);

  return ok();
};

const deleteListCommand = new Command("delete-list").description(
  "Delete the currently created list.",
);

export default deleteListCommand;
