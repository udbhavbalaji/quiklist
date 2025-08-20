import { input, select, confirm } from "@inquirer/prompts";
import { LogLevel } from "@udawg00/logify";
import logger from "./logger";
import { err, ok } from "neverthrow";
import { QLUserInputtedConfig } from "../types/config";
import { date_formats } from "../types";
import { ListOptions } from "../types/list";
import { pathValidator } from "./validator";
import { priority_styles } from "../types/list";

const handlePromptError = (error: any, fnName: string) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    logger.error("Operation terminated.");
    process.exit(1);
  } else
    return err({
      message: (error as Error).message,
      location: fnName,
      messageLevel: "error" as LogLevel,
    });
};

export const initListPrompt = async (defaultListOptions: ListOptions) => {
  try {
    const listName = await input({
      message: "Your list's name: ",
      default: defaultListOptions.listName,
    });

    const appDir = await input({
      message: "Here's where your list data is stored: ",
      default: defaultListOptions.appDir,
      validate: pathValidator,
    });

    // const includePriority = await confirm({
    //   message: "Should this list include priorities?: ",
    //   default: defaultListOptions.includePriority,
    // });

    const deleteOnDone = await confirm({
      message: "Should we delete items as you're done with them?",
      default: defaultListOptions.deleteOnDone,
    });

    const priorityStyle = await select({
      message: "How do you want the priorities displayed? ",
      choices: priority_styles.map((value) => {
        return { value };
      }),
      default: defaultListOptions.priorityStyle,
    });

    return ok({
      listName,
      appDir,
      deleteOnDone,
      priorityStyle,
    });
  } catch (error) {
    return handlePromptError(error, "initListPrompt");
  }
};

export const configurePrompt = async (defaultConfig: QLUserInputtedConfig) => {
  try {
    const answers = {
      userName: await input({
        message: "Enter your name: ",
        default: defaultConfig.userName,
        required: true,
      }),
      dateFormat: await select({
        message: "Select your preferred date format: ",
        choices: date_formats.map((value) => {
          return { value };
        }),
        default: defaultConfig.dateFormat,
      }),
    };
    return ok(answers);
  } catch (error) {
    return handlePromptError(error, "configurePrompt");
  }
};
