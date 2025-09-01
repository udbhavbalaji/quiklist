import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";

import { initGlobalConfig } from "@v2/lib/config";
import { asyncErrorHandler, errorHandler } from "@v2/lib/handle-error";
import {
  getCurrentOrGlobalListInfo,
  loadConfig,
  loadMetadata,
} from "@v2/lib/file-io";
import {
  addCommand,
  createListCommand,
  deleteCommand,
  editCommand,
  initAppCommand,
} from "@v2/commands";
import { addItemToList, handleAddItemCommand } from "./commands/add";
import createList from "./commands/create";
import showCommand from "@/commands/show";
import showListItems from "./commands/show";
import markCommand from "@/commands/mark";
import markItems from "./commands/mark";
import deleteItems from "./commands/delete";
import editItemDetails from "./commands/edit";

const configDir = path.join(os.homedir(), ".config", "quiklistv2");
const configFilepath = path.join(configDir, "config.json");

const launchQuiklist = (appVersion: string) => {
  const app = new Command("quiklist")
    .description("The fastest checklist app for the terminal.")
    .version(appVersion)
    .alias("ql");

  if (!fs.existsSync(configFilepath)) {
    initAppCommand.action(async () =>
      asyncErrorHandler(initGlobalConfig(configFilepath)),
    );

    app.addCommand(initAppCommand);
  } else {
    // load the config
    const config = errorHandler(loadConfig(configFilepath));

    // check if current dir has a qlist initialized, if no then only show the init command, if yes then only show the delete-list command
    const listInfo = getCurrentOrGlobalListInfo(config.lists);

    // // if list name is global, then add the -g flag to all commands and remove the delete-list command
    // if (listInfo.key === "global") {
    //   // otherwise add the delete-list command, and don't add the init command
    // } else {
    // }

    const metadata = errorHandler(
      loadMetadata(path.join(listInfo.value, "metadata.json")),
    );

    ////  extra config for each command

    // createList command
    createListCommand.action(async (options) =>
      asyncErrorHandler(createList(options.y, config, configFilepath)),
    );

    // add command
    addCommand.description(`Add item to '${metadata.name}'`);

    if (metadata.priorityStyle !== "none") {
      addCommand
        .option(
          "-m, --medium",
          "Specify that the item has a 'MEDIUM' priority.",
          false,
        )
        .option(
          "--h, --high",
          "Specify that the item has a 'HIGH' priority.",
          false,
        )
        .option(
          "-d, --deadline [deadline]",
          `Specify the task's deadline in your selected date format. (Chosen format: ${config.dateFormat})`,
        );
    }

    addCommand
      .argument("[item_desc...]", "Text description for the list item.")
      .action(async (item_desc: string[], options) => {
        const { itemDesc, priority, deadline } = await asyncErrorHandler(
          handleAddItemCommand(item_desc, options, config.dateFormat),
        );
        return asyncErrorHandler(
          addItemToList(metadata.datasetFilepath, itemDesc, priority, deadline),
        );
      });

    // show command
    showCommand.action(async (options) =>
      asyncErrorHandler(
        showListItems(
          metadata.datasetFilepath,
          options.unchecked,
          config.dateFormat,
          metadata.priorityStyle,
          metadata.sortCriteria,
          metadata.sortOrder,
        ),
      ),
    );

    // mark command
    markCommand.action(async () =>
      asyncErrorHandler(
        markItems(
          metadata.datasetFilepath,
          config.dateFormat,
          metadata.priorityStyle,
        ),
      ),
    );

    // delete command
    deleteCommand
      .description(`Delete item from '${metadata.name}'`)
      .action(async () =>
        asyncErrorHandler(
          deleteItems(
            metadata.datasetFilepath,
            config.dateFormat,
            metadata.priorityStyle,
          ),
        ),
      );

    // edit command
    editCommand.action(async () =>
      asyncErrorHandler(
        editItemDetails(
          metadata.datasetFilepath,
          config.dateFormat,
          metadata.priorityStyle,
        ),
      ),
    );

    // delete-list command

    // registering the commands
    if (listInfo.key === "global") {
      app.addCommand(createListCommand);
      addCommand.option("-g, --global", "Add item to global quiklist.", false);
      showCommand.option(
        "-g, --global",
        "Show items from global quiklist.",
        false,
      );
      markCommand.option(
        "-g, --global",
        "Mark/Unmark items in global quiklist.",
        false,
      );
      editCommand.option(
        "-g, --global",
        "Edit items in global quiklist.",
        false,
      );
      deleteCommand.option(
        "-g, --global",
        "Delete items from global quiklist.",
        false,
      );
    } else {
      // TODO: need to add this command
      // app.addCommand(deleteListCommand);
      console.log("im coming here");
    }

    app.addCommand(addCommand);
    app.addCommand(showCommand);
    app.addCommand(deleteCommand);
    app.addCommand(markCommand);
    app.addCommand(editCommand);
  }
  return app;
};

export default launchQuiklist;
