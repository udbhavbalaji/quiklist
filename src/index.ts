import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { loadConfig, loadMetadata } from "@/lib/file-io";
import logger from "@/lib/logger";
import { asyncErrorHandler, errorHandler } from "@/lib/error-handle";
import { initGlobalConfig } from "@/lib/config";
import { isProcessWithinCreatedList } from "@/lib/predicate";
import initListCommand, { initializeList } from "@/commands/initList";
import addCommand, { addToList } from "@/commands/add";
import markCommand, { markItemAsDone } from "@/commands/mark";

const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

console.log("entering file");

const launchQuiklist = () => {
  logger.debug("coming into function at least");
  const app = new Command("quiklist")
    .description("The quickest command line checklist.")
    .version("0.0.1");

  if (!fs.existsSync(configFilepath)) {
    app
      .option("-i, --init", "Create quiklist's global configuration.", false)
      .action(async (options) =>
        options.init
          ? asyncErrorHandler(initGlobalConfig(configFilepath))
          : app.help(),
      );
    logger.debug("config file does not exist");
  } else {
    // load the config
    const config = errorHandler(loadConfig(configFilepath));

    // check the current process path and see if there's a list linked to that?
    const inChildFolder = isProcessWithinCreatedList(config.lists);

    // if not, only show the init command to initialize the list in the current config
    if (inChildFolder.isErr()) {
      initListCommand.action(async (options) =>
        asyncErrorHandler(initializeList(options.d, config, configFilepath)),
      );
      app.addCommand(initListCommand);
    }
    // if there is, load in those metadata
    else {
      const metadata = errorHandler(
        loadMetadata(path.join(inChildFolder.value.value, "metadata.json")),
      );

      // // extra command config
      // addCommand
      if (metadata.priorityStyle !== "none") {
        addCommand.option("-p, [priority]", "specify the priority level");
      }
      addCommand
        .argument("[item_text...]", "Text for the list item")
        .action((item_text: string[], options) => {
          return errorHandler(
            addToList(metadata.dataFilepath, item_text.join(" "), options.p),
          );
        })
        .description(`Add item to ${metadata.name}`);

      // markCommand
      markCommand.action(async () =>
        asyncErrorHandler(markItemAsDone(metadata.dataFilepath)),
      );

      // // binding the commands to the app
      app.addCommand(addCommand);
      app.addCommand(markCommand);
      logger.info("Found app config folder");
    }
  }
  logger.info("done");
  return app;
};

console.log("leaving file");
export default launchQuiklist;
