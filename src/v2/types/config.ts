import { DateFormat, PriorityStyle, SortCriteria, SortOrder } from ".";

export type QLUserInputtedConfig = {
  userName: string;
  dateFormat: DateFormat;
};

export type QLCompleteConfig = QLUserInputtedConfig & {
  lists: Record<string, string>;
};

export type ConfigSelectOptions =
  | readonly PriorityStyle[]
  | readonly SortCriteria[]
  | readonly SortOrder[]
  | readonly DateFormat[];
