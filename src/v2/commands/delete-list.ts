import { loadMetadata, saveConfig } from "@v2/lib/file-io";
import { QLCompleteConfig } from "@v2/types/config";
import { removeDir } from "@v2/lib/file-io";
import logger from "@v2/lib/logger";
import { err, ok } from "neverthrow";

const deleteList = async (
  metadataFilepath: string,
  config: QLCompleteConfig,
  configFilepath: string,
) => {
  const metadataRes = loadMetadata(metadataFilepath);

  if (metadataRes.isErr())
    return err({
      ...metadataRes.error,
      location: `${metadataRes.error.location} -> deleteList`,
    });

  const { name } = metadataRes.value;

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

  logger.info(`'${name}' has been deleted.`);

  return ok();
};

export default deleteList;
