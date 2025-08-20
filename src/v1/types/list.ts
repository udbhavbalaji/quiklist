export type ListMetadata = {
  name: string;
  // records: ListItem[];
  dataFilepath: string;
  deleteOnDone: boolean;
  priorityStyle: PriorityStyle;
};

export const priorities = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof priorities)[number];

export const priority_styles = [
  "*/**/***",
  "!/!!/!!!",
  "1/2/3",
  "none",
] as const;
export type PriorityStyle = (typeof priority_styles)[number];

export const PriorityMapping = {};

export type ListItem = {
  done: boolean;
  item: string;
  priority?: Priority;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ListOptions = {
  listName: string;
  appDir: string;
  deleteOnDone: boolean;
  priorityStyle: PriorityStyle;
};
