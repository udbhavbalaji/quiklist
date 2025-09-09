// External imports
import { Command } from "commander";
import fs from "fs";
import os from "os";
import path from "path";

// Internal imports
import initGlobalConfig from "@v2/commands/init";
import { asyncErrorHandler, errorHandler } from "@v2/lib/handle-error";
import {
  detectExistingQuiklist,
  getCurrentOrGlobalListInfo,
  loadConfig,
  loadMetadata,
} from "@v2/lib/file-io";
import {
  addCommand,
  configCommand,
  createListCommand,
  deleteCommand,
  deleteListCommand,
  editCommand,
  initAppCommand,
  markCommand,
  modifyConfigCommand,
  showCommand,
  showConfigCommand,
} from "@v2/commands";
import { addItemToList, handleAddItemCommand } from "@v2/commands/add";
import createList, { syncList } from "@v2/commands/create";
import showListItems from "@v2/commands/show";
import markItems from "@v2/commands/mark";
import deleteItems from "@v2/commands/delete";
import editItemDetails from "@v2/commands/edit";
import deleteList from "@v2/commands/delete-list";
import { modifyConfig, showConfig } from "./commands/config";
import { getConfirmPrompt } from "./lib/prompt";

// module-level vars
const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

// launch function for quiklist, returning the built app
export const launchQuiklist = (appVersion: string) => {
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
    const config = errorHandler(loadConfig(configFilepath));

    // gets the info about the quiklist you're currently in, falls back to global list if no other list exists
    const listInfo = getCurrentOrGlobalListInfo(config.lists);

    const metadata = errorHandler(
      loadMetadata(path.join(listInfo.value, "metadata.json")),
    );

    const globalMetadata = errorHandler(
      loadMetadata(path.join(config.lists.global, "metadata.json")),
    );

    ////  extra config for each command

    // createList command
    createListCommand.action(async (options) => {
      const checkExistingList = detectExistingQuiklist();

      if (checkExistingList.isErr()) {
        return asyncErrorHandler(
          createList(options.y, config, configFilepath, globalMetadata),
        );
      }
      return asyncErrorHandler(
        syncList(
          checkExistingList.value,
          globalMetadata,
          config,
          configFilepath,
        ),
      );
    });

    // add command
    addCommand
      .description(`Add item to '${metadata.name}'`)
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
    showCommand.action(async (options) =>
      asyncErrorHandler(
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
      ),
    );

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
          options.global ? globalMetadata.sortCriteria : metadata.sortCriteria,
          options.global ? globalMetadata.sortOrder : metadata.sortOrder,
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
            options.global
              ? globalMetadata.sortCriteria
              : metadata.sortCriteria,
            options.global ? globalMetadata.sortOrder : metadata.sortOrder,
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
          options.global ? globalMetadata.sortCriteria : metadata.sortCriteria,
          options.global ? globalMetadata.sortOrder : metadata.sortOrder,
          config.useEditorForUpdatingText,
        ),
      ),
    );

    // delete-list command
    deleteListCommand
      .description(`Delete '${metadata.name}'.`)
      .action(async () => {
        const userConfirmed = await asyncErrorHandler(
          getConfirmPrompt({
            message: `Are you sure you want to delete '${metadata.name}'? This action cannot be undone.`,
            default: false,
          }),
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

    // show config command
    showConfigCommand.action((options) =>
      showConfig(config, options.global ? globalMetadata : metadata),
    );

    // edit config command
    modifyConfigCommand.action(async (options) =>
      asyncErrorHandler(
        modifyConfig(
          config,
          configFilepath,
          options.global ? globalMetadata : metadata,
          path.join(
            options.global ? config.lists.global : listInfo.value,
            "metadata.json",
          ),
        ),
      ),
    );

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
    showConfigCommand.option(
      "-g, --global",
      "Show configuration for your global quiklist.",
    );
    modifyConfigCommand.option(
      "-g, --global",
      "Edit configuration for your global quiklist.",
    );

    // registering the commands
    configCommand.addCommand(showConfigCommand);
    configCommand.addCommand(modifyConfigCommand);

    app.addCommand(addCommand);
    app.addCommand(showCommand);
    app.addCommand(deleteCommand);
    app.addCommand(markCommand);
    app.addCommand(editCommand);
    app.addCommand(configCommand);

    if (isListGlobal) {
      app.addCommand(createListCommand);
    } else {
      app.addCommand(deleteListCommand);
    }
  }
  return app;
};

// launch function for quiklist-global, returning the built app for the user's global quiklist
export const launchGlobalQuiklist = (appVersion: string) => {
  const app = new Command("quiklist-global")
    .alias("qlg")
    .description("The fastest checklist app for the terminal.")
    .version(appVersion);

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
      )
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
            globalMetadata.sortCriteria,
            globalMetadata.sortOrder,
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
            globalMetadata.sortCriteria,
            globalMetadata.sortOrder,
            config.useEditorForUpdatingText,
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
            globalMetadata.sortCriteria,
            globalMetadata.sortOrder,
          ),
        ),
      );

    // show config command
    showConfigCommand.action(() => showConfig(config, globalMetadata));

    // edit config command
    modifyConfigCommand.action(async () =>
      asyncErrorHandler(
        modifyConfig(
          config,
          configFilepath,
          globalMetadata,
          path.join(config.lists.global, "metadata.json"),
        ),
      ),
    );

    // registering the commmands
    configCommand.addCommand(showConfigCommand);
    configCommand.addCommand(modifyConfigCommand);

    app.addCommand(addCommand);
    app.addCommand(showCommand);
    app.addCommand(markCommand);
    app.addCommand(editCommand);
    app.addCommand(deleteCommand);
    app.addCommand(configCommand);
  }
  return app;
};
