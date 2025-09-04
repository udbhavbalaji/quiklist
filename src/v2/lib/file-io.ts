import fs from "fs";
import path from "path";
import { ok } from "neverthrow";

import { handleIOError } from "@v2/lib/handle-error";
import { QLCompleteConfig } from "@v2/types/config";
import { QLList, QLListOptions } from "@v2/types/list";
import logger from "@v2/lib/logger";

export const addToGitIgnore = (pathToIgnore: string) => {
  try {
    const ignoreRule = `\n# quiklist app data\n${pathToIgnore}`;
    const gitignoreFilepath = path.join(process.cwd(), ".gitignore");

    if (!fs.existsSync(gitignoreFilepath)) {
      logger.info(".gitignore not found...");
      return ok();
    }

    const currentContent = fs.readFileSync(gitignoreFilepath, "utf-8");

    if (currentContent.includes(".quiklist/")) {
      logger.debug("The file already exists in .gitingore");
      return ok();
    }

    fs.appendFileSync(gitignoreFilepath, ignoreRule, "utf-8");
    logger.info(`Added ${pathToIgnore} to .gitignore.`);
    return ok();
  } catch (error) {
    return handleIOError(error, "addToGitIgnore");
  }
};

export const renameListFile = (oldPath: string, newPath: string) => {
  try {
    fs.renameSync(oldPath, newPath);
    return ok();
  } catch (error) {
    return handleIOError(error, "renameListFile");
  }
};

export const saveConfig = (config: QLCompleteConfig, filepath: string) =>
  writeData(config, filepath, "saveConfig");

export const saveMetadata = (metadata: QLListOptions, filepath: string) =>
  writeData(metadata, filepath, "saveMetadata");

export const saveList = (list: QLList, filepath: string) =>
  writeData(list, filepath, "saveList");

const writeData = <Data>(data: Data, filepath: string, location: string) => {
  try {
    fs.appendFileSync(filepath, JSON.stringify(data, null, 2), { flag: "w" });
    return ok();
  } catch (error) {
    return handleIOError(error, location);
  }
};

const readData = <Data>(filepath: string, location: string) => {
  try {
    const data = fs.readFileSync(filepath, { encoding: "utf-8" });
    const dataJson = JSON.parse(data);
    return ok(dataJson as Data);
  } catch (error) {
    return handleIOError(error, location);
  }
};

export const loadList = (filepath: string) =>
  readData<QLList>(filepath, "loadList");

export const loadConfig = (filepath: string) =>
  readData<QLCompleteConfig>(filepath, "loadConfig");

export const loadMetadata = (filepath: string) =>
  readData<QLListOptions>(filepath, "loadMetadata");

export const createDir = (dirName: string) => {
  try {
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }
    return ok();
  } catch (error) {
    return handleIOError(error, "createDir");
  }
};

export const removeDir = (dirName: string) => {
  try {
    fs.rmSync(dirName, { recursive: true });
    return ok();
  } catch (error) {
    return handleIOError(error, "removeDir");
  }
};

export const getCurrentOrGlobalListInfo = (
  existingLists: QLCompleteConfig["lists"],
) => {
  const currentProcessPath = path.normalize(process.cwd());

  const { ["global"]: globalAppDir, ...nonGlobalLists } = existingLists;

  for (const [key, value] of Object.entries(nonGlobalLists)) {
    const listPath = path.dirname(path.normalize(value));
    if (currentProcessPath.startsWith(listPath)) {
      return { key, value };
    } else if (currentProcessPath === listPath) {
      return { key, value };
    }
  }
  return { key: "global", value: globalAppDir };
};
