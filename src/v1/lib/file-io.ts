import * as fs from "fs";
import * as path from "path";
import { err, ok } from "neverthrow";
import { LogLevel } from "@/types/logger";

import { QLCompleteConfig } from "@/types/config";
import { FileInputTypes } from "@/types/file-io";
import { ListItem, ListMetadata } from "@/types/list";
import logger from "@/lib/logger";

const handleIOError = (error: any, fnName: string) => {
  let message: string;
  if (error instanceof Error) {
    if ((error as any).code === "EACCES") {
      message =
        "Please use 'sudo' before your command as this command requires extra permissions.";
    } else {
      message = error.message;
    }
  } else message = "Uh oh, something went horribly wrong :(";
  return err({
    message,
    location: fnName,
    messageLevel: "error" as LogLevel,
  });
};

export const loadData = (filepath: string) => {
  if (fs.existsSync(filepath)) {
    const data = readFile<ListItem[]>(filepath);
    return ok(data);
  }
  return err({
    message: "data_file_not_found",
    location: "loadData",
    MessageLevel: "panic" as LogLevel,
  });
};

export const loadMetadata = (filepath: string) => {
  if (fs.existsSync(filepath)) {
    const metadata = readFile<ListMetadata>(filepath);
    return ok(metadata);
  }
  return err({
    message: "metadata_not_found",
    location: "loadMetadata",
    MessageLevel: "panic" as LogLevel,
  });
};

export const loadConfig = (configFilepath: string) => {
  if (fs.existsSync(configFilepath)) {
    const config = readFile<QLCompleteConfig>(configFilepath);
    return ok(config);
  }
  return err({
    message: "config_not_found",
    location: "loadConfig",
    messageLevel: "panic" as LogLevel,
  });
};

export const saveData = (data: ListItem[], filepath: string) => {
  try {
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    fs.appendFileSync(filepath, JSON.stringify(data, null, 2), { flag: "w" });
    return ok();
  } catch (error) {
    return handleIOError(error, "saveData");
  }
};

export const saveMetadata = (metadata: ListMetadata, filepath: string) => {
  try {
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    logger.debug(filepath);
    fs.appendFileSync(filepath, JSON.stringify(metadata, null, 2), {
      flag: "w",
    });
    return ok();
  } catch (error) {
    return handleIOError(error, "saveMetadata");
  }
};

export const saveConfig = (
  config: QLCompleteConfig,
  configFilepath: string,
) => {
  try {
    fs.appendFileSync(configFilepath, JSON.stringify(config, null, 2), {
      flag: "w",
    });
    return ok();
  } catch (error) {
    return handleIOError(error, "saveConfig");
  }
};

export const addToGitIgnore = () => {
  try {
    const ignoreRule = "\n# quiklist app data\n.quiklist/";
    const gitignoreFilepath = path.join(process.cwd(), ".gitignore");
    const currentContent = fs.readFileSync(gitignoreFilepath, "utf-8");

    if (currentContent.includes(".quiklist/")) {
      logger.debug("The file already exists in .gitingore");
      return ok();
    }

    fs.appendFileSync(gitignoreFilepath, ignoreRule, "utf-8");
    logger.info("Added .quiklist/ to .gitignore.");
    return ok();
  } catch (error) {
    return handleIOError(error, "addToGitIgnore");
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

export const createDir = (dirName: string) => {
  try {
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    return ok();
  } catch (error) {
    return handleIOError(error, "createDir");
  }
};

export const writeFile = <T extends FileInputTypes>(
  filepath: string,
  data: T,
) => {
  fs.appendFileSync(filepath, JSON.stringify(data, null, 2), { flag: "w" });
};

export const readFile = <T>(filepath: string) => {
  const dataString = fs.readFileSync(filepath, {
    encoding: "utf-8",
  });
  const data = JSON.parse(dataString);
  return data as T;
};
