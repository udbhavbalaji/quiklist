import { SortOrder, SortCriteria, PriorityStyle, DateFormat } from "@v2/types";

export type QLGlobalListOptions = {
  priorityStyle: PriorityStyle;
  sortCriteria: SortCriteria;
  sortOrder: SortOrder;
};

export type QLListBasicOptions = {
  name: string;
  appDir: string;
};

export type QLList = {
  checked: QLListItem[];
  unchecked: QLListItem[];
};

export type QLListMetadata = QLGlobalListOptions & {
  name: string;
  datasetFilepath: string;
};

export type QLListItem = {
  checked: boolean;
  description: string;
  priority: Priority;
  deadline: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type QLListOption = QLListItem & { id: string };

export const priorities = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof priorities)[number];

export type QLPublicListConfig = {
  listName: string;
  userName: string;
  priorityStyle: PriorityStyle;
  sortCriteria: SortCriteria;
  sortOrder: SortOrder;
  dateFormat: DateFormat;
};
