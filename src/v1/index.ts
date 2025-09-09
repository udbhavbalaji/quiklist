import { Command } from "commander";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import { loadConfig, loadMetadata } from "@v1/lib/file-io";
import logger from "@v1/lib/logger";
import { asyncErrorHandler, errorHandler } from "@v1/lib/error-handle";
import { initGlobalConfig } from "@v1/lib/config";
import { isProcessWithinCreatedList } from "@v1/lib/predicate";
import initListCommand, { initializeList } from "@v1/commands/initList";
import addCommand, { addToList } from "@v1/commands/add";
import markCommand, { markItemAsDone } from "@v1/commands/mark";
import showCommand, { showItems } from "@v1/commands/show";
import { Priority } from "@v1/types/list";
import deleteCommand, { deleteItemFromList } from "@v1/commands/delete";
import editCommand, { editItemInList } from "@v1/commands/edit";
import { renderDate } from "@v1/lib/render";
import { dateValidator } from "@v1/lib/validator";
import deleteListCommand, { deleteList } from "@v1/commands/delete-list";
import { confirmPrompt, itemTextPrompt } from "@v1/lib/prompt";

const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

const launchQuiklist = (appVersion: string) => {
  // create the app
  const app = new Command("quiklist")
    .description("The quickest command line checklist.")
    .version(appVersion)
    .alias("ql");

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
          let itemText = item_text.join(" ");
          if (itemText === "") {
            itemText = await asyncErrorHandler(itemTextPrompt());
          }
          const priority = options.md
            ? ("MEDIUM" as Priority)
            : options.high
              ? ("HIGH" as Priority)
              : ("LOW" as Priority);

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
            addToList(metadata.dataFilepath, itemText, priority, deadline),
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

      deleteListCommand.action(async () => {
        const userConfirmed = await asyncErrorHandler(
          confirmPrompt(
            "Are you sure you want to delete this list? This action cannot be undone!",
          ),
        );

        if (userConfirmed) {
          return await asyncErrorHandler(
            deleteList(
              path.join(config.lists[metadata.name], "metadata.json"),
              config,
              configFilepath,
            ),
          );
        }
      });

      // // binding the commands to the app
      app.addCommand(addCommand);
      app.addCommand(markCommand);
      app.addCommand(showCommand);
      app.addCommand(deleteCommand);
      app.addCommand(editCommand);
      app.addCommand(deleteListCommand);
    }
  }
  return app;
};
// [ ]  !!!  remove unnecessary log statements or ensure that they dont show up to the user :: Added on: 25-08-2025
// [x]  !!!  ensure sorting functionality is available and settable in config :: Added on: 25-08-2025
// [x]  !!   ensure that .quiklist is added to gitignore if exists :: Added on: 25-08-2025
// [ ]  !!!  add sync support to shareable markdown file?

export default launchQuiklist;
