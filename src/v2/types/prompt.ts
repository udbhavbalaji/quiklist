import { select } from "@inquirer/prompts";

export type SelectChoice<T> = Parameters<typeof select>[0]["choices"];

export type TextPromptConfig = {
  message: string;
  default?: string;
  validate?: (value: string) => string | boolean | Promise<string | boolean>;
};

export type TextPromptArgs = {
  message: string;
  useEditor: boolean;
  required: boolean;
  default?: string;
  validate?: (value: string) => string | boolean | Promise<string | boolean>;
};

// message: string,
// useEditor: boolean,
// required = false,
// defaultValue?: string,
// validate?: (value: string) => string | boolean | Promise<string | boolean>,
