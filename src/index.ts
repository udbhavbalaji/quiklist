import { Command } from "commander";
import { loadConfig } from "./v1/lib/file-io";
import logger from "./v1/lib/logger";
import { asyncErrorHandler, errorHandler } from "./v1/lib/error-handle";
import { initGlobalConfig } from "./v1/lib/config";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { isProcessWithinCreatedList } from "./v1/lib/predicate";
import initListCommand, { initializeList } from "./v1/commands/initList";

const configDir = path.join(os.homedir(), ".config", "quiklist");
const configFilepath = path.join(configDir, "config.json");

const launchQuiklist = () => {
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
        asyncErrorHandler(initializeList(options.d)),
      );
      app.addCommand(initListCommand);
    }
    // if there is, load in those metadata
    else {
    }
  }
  logger.debug("coming into function at least");
  return app;
};

// const launchQuiklist = () => {
//   const app = new Command("quiklist")
//     .description("The quickest command line checklist.")
//     .version("0.0.1");
//
//   // check if config exists and retrieve it if it does
//   const configResult = loadConfig(configDir);
//
//   if (configResult.isErr()) {
//     if (configResult.error.message !== "config_not_found") {
//       logger[configResult.error.messageLevel](configResult.error.message);
//       logger.debug(configResult.error.location);
//       process.exit(1);
//     } else {
//       app
//         .option("--init", "Create global configuration.", false)
//         .action(async (options) =>
//           options.init
//             ? asyncErrorHandler(initGlobalConfig(configDir))
//             : undefined,
//         );
//     }
//
//     // add option flag so that the user can configure the global config(can do this explicitly with this option command, or if doesn't exist, will get called when the user uses any other command)
//     app.addCommand(initCommand);
//   }
//
//   return app;
// };

export default launchQuiklist;
