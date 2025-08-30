import { DateFormat } from ".";

export type QLUserInputtedConfig = {
  userName: string;
  dateFormat: DateFormat;
};

export type QLCompleteConfig = QLUserInputtedConfig & {
  lists: Record<string, string>;
};
