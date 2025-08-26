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
import { err } from "neverthrow";
import { dateValidator } from "./lib/validator";

const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

const launchQuiklist = (appVersion: string) => {
  // create the app
  const app = new Command("quiklist")
    .description("The quickest command line checklist.")
    .version(appVersion);

  // check if global config exists
  if (!fs.existsSync(configFilepath)) {
    // if not, add option flag to start the process. That will be the only option available
    //  todo: can be made so that initiaiting any command begins the process if global config not found
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

    if (inChildFolder.isErr()) {
      logger.debug(inChildFolder.error.message);
      // if not, only show the init command to initialize the list in the current config
      initListCommand.action(async (options) =>
        asyncErrorHandler(initializeList(options.d, config, configFilepath)),
      );
      app.addCommand(initListCommand);
    } else {
      // if there is, load in those metadata
      const metadata = errorHandler(
        loadMetadata(path.join(inChildFolder.value.value, "metadata.json")),
      );

      // // extra command config
      // addCommand
      addCommand.description(`Add item to ${metadata.name}`);

      if (metadata.priorityStyle !== "none") {
        // note: default priority level is "LOW"
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
        .action(async (item_text: string[], options) => {
          const itemText = item_text.join(" ");
          if (itemText === "")
            return errorHandler(
              err({
                message: "text_content_empty",
                location: "addCommandHandler",
                messageLevel: "panic",
              }),
            );
          const priority = options.md
            ? ("MEDIUM" as Priority)
            : options.high
              ? ("HIGH" as Priority)
              : ("LOW" as Priority);
          // const deadline = options.deadline
          //   ? renderDate(options.deadline, config.dateFormat, true)
          //   : undefined;

          let deadline: string | undefined = undefined;

          if (options.deadline) {
            const validatedDeadline = await dateValidator(
              errorHandler(
                renderDate(options.deadline, config.dateFormat, true),
              ),
            );
            if (typeof validatedDeadline === "string") {
              logger.error(`${validatedDeadline}. Operation aborted.`);
              process.exit(1);
            }
            deadline = errorHandler(
              renderDate(options.deadline, config.dateFormat, true),
            );
          }
          return errorHandler(
            addToList(
              metadata.dataFilepath,
              item_text.join(" "),
              priority,
              deadline,
            ),
          );
        });

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
            metadata.sortCriteria,
            metadata.sortOrder,
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
    }
  }
  return app;
};
// [ ]  !!!  remove unnecessary log statements or ensure that they dont show up to the user :: Added on: 25-08-2025
// [ ]  !!!  ensure sorting functionality is available and settable in config :: Added on: 25-08-2025
// [ ]  !!   ensure that .quiklist is added to gitignore if exists :: Added on: 25-08-2025
// [ ]  !!!  add sync support to shareable markdown file?

export default launchQuiklist;
