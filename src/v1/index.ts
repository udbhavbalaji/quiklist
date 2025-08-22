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
import showCommand, { showItems } from "@/commands/show";
import { Priority } from "@/types/list";
import deleteCommand, { deleteItemFromList } from "@/commands/delete";
import editCommand, { editItemInList } from "./commands/edit";
import { renderDate } from "./lib/render";

const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

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
        addCommand.option(
          "--md",
          "Specify that the task is 'MEDIUM' priority.",
        );
        addCommand.option(
          "--high",
          "Specify that the task is 'HIGH' priority.",
        );
        addCommand.option(
          "-d, --deadline [deadline]",
          `Specify the task's deadline in your selected format. ${config.dateFormat}`,
        );
      }
      addCommand
        .argument("[item_text...]", "Text for the list item")
        .action((item_text: string[], options) => {
          const priority = options.md
            ? "MEDIUM"
            : options.high
              ? "HIGH"
              : ("LOW" as Priority);
          console.log(options);
          const deadline = options.deadline
            ? renderDate(options.deadline, config.dateFormat, true)
            : undefined;
          return errorHandler(
            addToList(
              metadata.dataFilepath,
              item_text.join(" "),
              priority,
              deadline,
            ),
          );
        })
        .description(`Add item to ${metadata.name}`);

      // markCommand
      markCommand.action(async () =>
        asyncErrorHandler(markItemAsDone(metadata.dataFilepath)),
      );

      // showCommand
      showCommand.action((options) =>
        errorHandler(
          showItems(
            metadata.dataFilepath,
            options.unchecked,
            config.dateFormat,
            metadata.priorityStyle,
            "none",
            "descending",
          ),
        ),
      );

      // deleteCommand
      deleteCommand.action(async () =>
        asyncErrorHandler(deleteItemFromList(metadata.dataFilepath)),
      );

      // editCommand
      editCommand.action(async () =>
        asyncErrorHandler(
          editItemInList(metadata.dataFilepath, config.dateFormat),
        ),
      );

      // // binding the commands to the app
      app.addCommand(addCommand);
      app.addCommand(markCommand);
      app.addCommand(showCommand);
      app.addCommand(deleteCommand);
      app.addCommand(editCommand);
      logger.info("Found app config folder");
    }
  }
  logger.info("done");
  return app;
};

export default launchQuiklist;
