import fs from "fs";
import path from "path";
import { err, ok } from "neverthrow";

import { handleIOError } from "./handle-error";
import { QLCompleteConfig } from "@v2/types/config";
import { QLList, QLListOptions } from "@v2/types/list";
import { LogLevel } from "@v2/types";

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

export const loadConfig = (filepath: string) =>
  readData<QLCompleteConfig>(filepath, "loadConfig");

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
  // return err({
  //   message: "No list found here.",
  //   location: "isProcessWithinCreatedList",
  //   messageLevel: "warn" as LogLevel,
  // });
};
