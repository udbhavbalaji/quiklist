import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";

import { initGlobalConfig } from "@v2/lib/config";
import { asyncErrorHandler, errorHandler } from "@v2/lib/handle-error";
import { getCurrentOrGlobalListInfo, loadConfig } from "@v2/lib/file-io";
import { QLListOptions } from "./types/list";

const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

const launchQuiklist = (appVersion: string) => {
  const app = new Command("quiklist")
    .description("The fastest checklist app for the terminal.")
    .version(appVersion)
    .alias("ql");

  if (!fs.existsSync(configFilepath)) {
    app
      .option("-i, --init", "Create quiklist's global configuration.", false)
      .action(async (options) =>
        options.init
          ? asyncErrorHandler(initGlobalConfig(configFilepath))
          : app.help(),
      );
  } else {
    // load the config
    const config = errorHandler(loadConfig(configFilepath));

    // check if current dir has a qlist initialized, if no then only show the init command, if yes then only show the delete-list command
    const listInfo = getCurrentOrGlobalListInfo(config.lists);

    // if list name is global, then add the -g flag to all commands and remove the delete-list command
    if (listInfo.key === "global") {
      // otherwise add the delete-list command, and don't add the init command
    } else {
    }
  }
};

export default launchQuiklist;
