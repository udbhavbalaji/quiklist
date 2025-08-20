import { DateFormat } from ".";

export type QLUserInputtedConfig = {
  userName: string;
  dateFormat: DateFormat;

  // feature: for future feature of sending emails
  // email: string
};

export type QLCompleteConfig = QLUserInputtedConfig & {
  lists: Record<string, string>;
};
