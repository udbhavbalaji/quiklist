import z from "zod";
import { err, ok } from "neverthrow";
import { input, select } from "@inquirer/prompts";

import { QLUserInputtedConfig } from "@v2/types/config";
import {
  date_formats,
  priority_styles,
  sort_criteria,
  sort_orders,
} from "@v2/types";
import { select as multiSelect } from "inquirer-select-pro";
import { QLGlobalListOptions } from "@v2/types/list";
import { handlePromptError } from "@v2/lib/handle-error";

export const globalListPrompt = async (
  defaultGlobalListOptions: QLGlobalListOptions,
) => {
  try {
    const priorityStyle = await select({
      message: "Select your preferred style for displaying priority",
      choices: priority_styles.map((value) => {
        return { value };
      }),
      default: defaultGlobalListOptions.priorityStyle,
    });
    const sortCriteria = await select({
      message: "Select sorting criteria: ",
      choices: sort_criteria.map((value) => {
        return { value };
      }),
      default: defaultGlobalListOptions.sortCriteria,
    });
    const sortOrder =
      sortCriteria !== "none"
        ? await select({
          message: "Select sort ordering: ",
          choices: sort_orders.map((value) => {
            return { value };
          }),
          default: defaultGlobalListOptions.sortOrder,
        })
        : defaultGlobalListOptions.sortOrder;
    return ok({ priorityStyle, sortCriteria, sortOrder });
  } catch (error) {
    return handlePromptError(error, "globalListPrompt");
  }
};

export const configurePrompt = async (defaultConfig: QLUserInputtedConfig) => {
  try {
    const config = {
      userName: await input({
        message: "Enter your name: ",
        default: defaultConfig.userName,
        validate: async (value) => {
          const res = await z.string().safeParseAsync(value);

          return res.success ? res.success : res.error.issues[0].message;
        },
      }),
      dateFormat: await select({
        message: "Choose your preferred date format: ",
        choices: date_formats.map((value) => {
          return { value };
        }),
        default: defaultConfig.dateFormat,
      }),
    };

    return ok(config);
  } catch (error) {
    return handlePromptError(error, "configurePrompt");
  }
};
