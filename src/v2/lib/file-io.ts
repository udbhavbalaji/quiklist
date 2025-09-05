// External imports
import fs from "fs";
import path from "path";
import { err, ok } from "neverthrow";

// Internal imports
import { handleIOError } from "@v2/lib/handle-error";
import { QLCompleteConfig } from "@v2/types/config";
import { QLList, QLListMetadata } from "@v2/types/list";
import logger from "@v2/lib/logger";

// function that checks if there already is a quiklist data file (assumed to be pulled from git)
export const detectExistingQuiklist = () => {
  const expectedAppDir = path.join(process.cwd(), ".quiklist");
  if (!fs.existsSync(expectedAppDir)) {
    return err({
      message: "quiklist_not_found",
      location: "detectExistingQuiklist",
    });
  }

  try {
    const filesWithinDir = fs.readdirSync(expectedAppDir);
    if (filesWithinDir.length !== 1)
      return err({
        message: "incorrect files exist",
        location: "detectExistingQuiklist",
      });

    const existingListName = filesWithinDir[0].split(".")[0];
    return ok({ name: existingListName, appDir: expectedAppDir });
  } catch (error) {
    return handleIOError(error, "detectExistingQuiklist");
  }
};

// function that adds the specified path to .gitignore
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

// function that renames a file (here, specifically, it renames the list data file name)
export const renameListFile = (oldPath: string, newPath: string) => {
  try {
    fs.renameSync(oldPath, newPath);
    return ok();
  } catch (error) {
    return handleIOError(error, "renameListFile");
  }
};

// function that saves the config for quiklist
export const saveConfig = (config: QLCompleteConfig, filepath: string) =>
  writeData(config, filepath, "saveConfig");

// function that saves the metadata for a specified quiklist
export const saveMetadata = (metadata: QLListMetadata, filepath: string) =>
  writeData(metadata, filepath, "saveMetadata");

// function that saves the list data for a specified quiklist
export const saveList = (list: QLList, filepath: string) =>
  writeData(list, filepath, "saveList");

// internal function that writes JSON objects to a file
const writeData = <Data>(data: Data, filepath: string, location: string) => {
  try {
    fs.appendFileSync(filepath, JSON.stringify(data, null, 2), { flag: "w" });
    return ok();
  } catch (error) {
    return handleIOError(error, location);
  }
};

// internal function that reads data JSON data from a file
const readData = <Data>(filepath: string, location: string) => {
  try {
    const data = fs.readFileSync(filepath, { encoding: "utf-8" });
    const dataJson = JSON.parse(data);
    return ok(dataJson as Data);
  } catch (error) {
    return handleIOError(error, location);
  }
};

// function that loads the list data for a specified quiklist
export const loadList = (filepath: string) =>
  readData<QLList>(filepath, "loadList");

// function that loads the config for quiklist
export const loadConfig = (filepath: string) =>
  readData<QLCompleteConfig>(filepath, "loadConfig");

// function that loads the metadata for a specified quiklist
export const loadMetadata = (filepath: string) =>
  readData<QLListMetadata>(filepath, "loadMetadata");

// function that creates a dir at the specified path
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

// function that removes a dir, (can also be used for files maybe?)
export const removeDir = (dirName: string) => {
  try {
    fs.rmSync(dirName, { recursive: true });
    return ok();
  } catch (error) {
    return handleIOError(error, "removeDir");
  }
};

// function that returns inside which quiklist app you're currently in, falling back to global ('guaranteed to exist')
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
