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
  deleteListCommand,
  editCommand,
  initAppCommand,
  markCommand,
  showCommand,
} from "@v2/commands";
import { addItemToList, handleAddItemCommand } from "./commands/add";
import createList from "./commands/create";
import showListItems from "./commands/show";
import markItems from "./commands/mark";
import deleteItems from "./commands/delete";
import editItemDetails from "./commands/edit";
import { confirmPrompt } from "./lib/prompt";
import deleteList from "./commands/delete-list";

const configDir = path.join(os.homedir(), ".config", "quiklistv2");
const configFilepath = path.join(configDir, "config.json");

export const launchQuiklist = (appVersion: string) => {
  const app = new Command("quiklist")
    .description("The fastest checklist app for the terminal.")
    .version(appVersion)
    .alias("ql")
    .action(() => app.help());

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

    const globalMetadata = errorHandler(
      loadMetadata(path.join(config.lists.global, "metadata.json")),
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
        );
    }

    addCommand
      .option(
        "-d, --deadline [deadline]",
        `Specify the task's deadline in your selected date format. (Chosen format: ${config.dateFormat})`,
      )
      .argument("[item_desc...]", "Text description for the list item.")
      .action(async (item_desc: string[], options) => {
        const { itemDesc, priority, deadline } = await asyncErrorHandler(
          handleAddItemCommand(item_desc, options, config.dateFormat),
        );
        return asyncErrorHandler(
          addItemToList(
            options.global
              ? globalMetadata.datasetFilepath
              : metadata.datasetFilepath,
            itemDesc,
            priority,
            deadline,
          ),
        );
      });

    // show command
    showCommand.action(async (options) => {
      return asyncErrorHandler(
        showListItems(
          options.global
            ? globalMetadata.datasetFilepath
            : metadata.datasetFilepath,
          options.unchecked,
          config.dateFormat,
          options.global
            ? globalMetadata.priorityStyle
            : metadata.priorityStyle,
          options.global ? globalMetadata.sortCriteria : metadata.sortCriteria,
          options.global ? globalMetadata.sortOrder : metadata.sortOrder,
          options.global ? globalMetadata.name : metadata.name,
        ),
      );
    });

    // mark command
    markCommand.action(async (options) =>
      asyncErrorHandler(
        markItems(
          options.global
            ? globalMetadata.datasetFilepath
            : metadata.datasetFilepath,
          config.dateFormat,
          options.global
            ? globalMetadata.priorityStyle
            : metadata.priorityStyle,
          options.global ? globalMetadata.name : metadata.name,
        ),
      ),
    );

    // delete command
    deleteCommand
      .description(`Delete item from '${metadata.name}'`)
      .action(async (options) =>
        asyncErrorHandler(
          deleteItems(
            options.global
              ? globalMetadata.datasetFilepath
              : metadata.datasetFilepath,
            config.dateFormat,
            options.global
              ? globalMetadata.priorityStyle
              : metadata.priorityStyle,
            options.global ? globalMetadata.name : metadata.name,
          ),
        ),
      );

    // edit command
    editCommand.action(async (options) =>
      asyncErrorHandler(
        editItemDetails(
          options.global
            ? globalMetadata.datasetFilepath
            : metadata.datasetFilepath,
          config.dateFormat,
          options.global
            ? globalMetadata.priorityStyle
            : metadata.priorityStyle,
          options.global ? globalMetadata.name : metadata.name,
        ),
      ),
    );

    // delete-list command
    deleteListCommand
      .description(`Delete '${metadata.name}'.`)
      .action(async () => {
        const userConfirmed = await asyncErrorHandler(
          confirmPrompt(
            `Are you sure you want to delete '${metadata.name}'? This action cannot be undone.`,
          ),
        );
        if (userConfirmed)
          return asyncErrorHandler(
            deleteList(
              path.join(listInfo.value, "metadata.json"),
              config,
              configFilepath,
            ),
          );
      });

    // registering the commands

    const isListGlobal = listInfo.key === "global";

    // set up global flags for each of the commands
    addCommand.option(
      "-g, --global",
      "Add item to global quiklist.",
      isListGlobal,
    );
    showCommand.option(
      "-g, --global",
      "Show items from global quiklist.",
      isListGlobal,
    );
    markCommand.option(
      "-g, --global",
      "Mark/Unmark items in global quiklist.",
      isListGlobal,
    );
    editCommand.option(
      "-g, --global",
      "Edit items in global quiklist.",
      isListGlobal,
    );
    deleteCommand.option(
      "-g, --global",
      "Delete items from global quiklist.",
      isListGlobal,
    );

    app.addCommand(addCommand);
    app.addCommand(showCommand);
    app.addCommand(deleteCommand);
    app.addCommand(markCommand);
    app.addCommand(editCommand);

    if (isListGlobal) {
      app.addCommand(createListCommand);
    } else {
      app.addCommand(deleteListCommand);
    }
  }
  return app;
};

export const launchGlobalQuiklist = (appVersion: string) => {
  const app = new Command("quiklist-global")
    .alias("qlg")
    .description("The fastest checklist app for the terminal.")
    .version(appVersion)
    .action(() => app.help());

  if (!fs.existsSync(configFilepath)) {
    initAppCommand.action(async () =>
      asyncErrorHandler(initGlobalConfig(configFilepath)),
    );

    app.addCommand(initAppCommand);
  } else {
    const config = errorHandler(loadConfig(configFilepath));
    const globalMetadata = errorHandler(
      loadMetadata(path.join(config.lists.global, "metadata.json")),
    );

    //// extra config for each command

    // add command
    addCommand
      .description("Add item to your global quiklist.")
      .option(
        "-d, --deadline [deadline]",
        `Specify the task's deadline in your selected date format. (Chosen format: ${config.dateFormat})`,
      );
    if (globalMetadata.priorityStyle !== "none") {
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
        );
    }

    addCommand
      .argument("[item_desc...]", "Text description for the list item.")
      .action(async (item_desc: string[], options) => {
        const { itemDesc, priority, deadline } = await asyncErrorHandler(
          handleAddItemCommand(item_desc, options, config.dateFormat),
        );
        return asyncErrorHandler(
          addItemToList(
            globalMetadata.datasetFilepath,
            itemDesc,
            priority,
            deadline,
          ),
        );
      });

    // show command
    showCommand
      .description("Show items in your global quiklist.")
      .action(async (options) => {
        return asyncErrorHandler(
          showListItems(
            globalMetadata.datasetFilepath,
            options.unchecked,
            config.dateFormat,
            globalMetadata.priorityStyle,
            globalMetadata.sortCriteria,
            globalMetadata.sortOrder,
            globalMetadata.name,
          ),
        );
      });

    // mark command
    markCommand
      .description("Mark/Unmark items in your global quiklist.")
      .action(async () =>
        asyncErrorHandler(
          markItems(
            globalMetadata.datasetFilepath,
            config.dateFormat,
            globalMetadata.priorityStyle,
            globalMetadata.name,
          ),
        ),
      );

    // edit command
    editCommand
      .description("Edit item details in your global quiklist.")
      .action(async () =>
        asyncErrorHandler(
          editItemDetails(
            globalMetadata.datasetFilepath,
            config.dateFormat,
            globalMetadata.priorityStyle,
            globalMetadata.name,
          ),
        ),
      );

    // delete command
    deleteCommand
      .description("Delete items from your global quiklist.")
      .action(async () =>
        asyncErrorHandler(
          deleteItems(
            globalMetadata.datasetFilepath,
            config.dateFormat,
            globalMetadata.priorityStyle,
            globalMetadata.name,
          ),
        ),
      );
    app.addCommand(addCommand);
    app.addCommand(showCommand);
    app.addCommand(markCommand);
    app.addCommand(editCommand);
    app.addCommand(deleteCommand);
  }
  return app;
};
