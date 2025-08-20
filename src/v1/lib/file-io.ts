import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { QLCompleteConfig } from "../types/config";
import { err, ok, Result } from "neverthrow";
import {
  FileInputFunction,
  FileInputTypes,
  FileOutputFunction,
} from "../types/file-io";
import { ArgsOf, QLError } from "../types";
import { LogLevel } from "@udawg00/logify";
import Stream from "stream";
import { ListItem, ListMetadata } from "../types/list";
import { file } from "zod";
import logger from "./logger";

const handleIOError = (error: any, fnName: string) => {
  let message: string;
  if (error instanceof Error) {
    if ((error as any).code === "EACCES") {
      message =
        "Please use 'sudo' before your command as this command requires extra permissions.";
    } else {
      console.log("coming here lololol");
      message = error.message;
    }
  } else message = "Uh oh, something went horribly wrong :(";
  return err({
    message,
    location: fnName,
    messageLevel: "error" as LogLevel,
  });
};

export const loadMetadata = () => { };

export const loadConfig = (configFilepath: string) => {
  // const configFilepath = path.join(configDir, "config.json");

  if (fs.existsSync(configFilepath)) {
    const config = readFile<QLCompleteConfig>(configFilepath);
    return ok(config);
  }
  return err({
    message: "config_not_found",
    location: "loadConfig",
    messageLevel: "warn" as LogLevel,
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
  // const configFilepath = path.join(configDir, "config.json");

  try {
    fs.appendFileSync(configFilepath, JSON.stringify(config, null, 2), {
      flag: "w",
    });
    return ok();
  } catch (error) {
    return handleIOError(error, "saveConfig");
  }
};

export const handleFileOutputError = (
  fn: FileOutputFunction,
  args: [ArgsOf<typeof fn>[0], ArgsOf<typeof fn>[1]],
): Result<ReturnType<typeof fn>, QLError> => {
  try {
    return ok(fn(...args));
  } catch (error) {
    let message: string;
    if (error instanceof Error) {
      if ((error as any).code === "EACCES") {
        message =
          "Please use 'sudo' before your command as this command requires extra permissions.";
      } else {
        console.log("coming here lololol");
        message = error.message;
      }
    } else message = "Uh oh, something went horribly wrong :(";
    return err({
      message,
      location: fn.name,
      messageLevel: "error" as LogLevel,
    });
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

const handleFileInputError = (
  fn: FileInputFunction,
  args: ArgsOf<typeof fn>[0],
): Result<ReturnType<typeof fn>, QLError> => {
  try {
    return ok(fn(args));
  } catch (error) {
    let message: string;
    if (error instanceof Error) {
      if ((error as any).code === "EACCES") {
        message =
          "Please use 'sudo' before your command as this command requires extra permissions.";
      } else {
        console.log("coming here lololol");
        message = error.message;
      }
    } else message = "Uh oh, something went horribly wrong :(";
    return err({
      message,
      location: fn.name,
      messageLevel: "error" as LogLevel,
    });
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
