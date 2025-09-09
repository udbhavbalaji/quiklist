import type { Action } from "inquirer-honshin-select";
import { select as multiSelect } from "inquirer-select-pro";

export type TextPromptConfig = {
  message: string;
  default?: string;
  validate?: (value: string) => string | boolean | Promise<string | boolean>;
};

export type TextPromptArgs = {
  message: string;
  prefill?: "tab" | "editable";
  useEditor?: boolean;
  required?: boolean;
  default?: string;
  validate?: (value: string) => string | boolean | Promise<string | boolean>;
};

export type SingleSelectPromptArgs<T> = {
  message: string;
  choices: readonly T[];
  default?: T;
};

export type MultiSelectPromptArgs<T extends Record<"value" | "name", string>> =
  {
    message: string;
    options: readonly (string | T)[];
    default?: T["value"][];
    theme?: Parameters<typeof multiSelect>[0]["theme"];
  };

export type ActionSelectPromptArgs<
  T extends Record<"value" | "name", string>,
  ActionValue,
> = {
  message: string;
  choices: readonly (string | T)[];
  actions: Action<ActionValue>[];
  default?: T;
};

export type ConfirmPromptArgs = {
  message: string;
  default: boolean;
};
