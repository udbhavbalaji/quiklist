export type ListMetadata = {
  name: string;
  dataFilepath: string;
  deleteOnDone: boolean;
  priorityStyle: PriorityStyle;
  // future add-on
  // deadline: boolean
};

export const sort_criteria = [
  "none",
  "priority",
  "created",
  "deadline",
] as const;
export type SortCriteria = (typeof sort_criteria)[number];

export const sort_orders = ["ascending", "descending"] as const;
export type SortOrder = (typeof sort_orders)[number];

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
  priority: Priority;
  deadline: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export const styleMapping: Record<PriorityStyle, Record<Priority, string>> = {
  "!/!!/!!!": {
    HIGH: "!!!",
    MEDIUM: "!! ",
    LOW: "!  ",
  },
  "*/**/***": {
    HIGH: "***",
    MEDIUM: "** ",
    LOW: "*  ",
  },
  "1/2/3": {
    HIGH: "3",
    MEDIUM: "2",
    LOW: "1",
  },
  none: {
    HIGH: "",
    MEDIUM: "",
    LOW: "",
  },
};

// export const inverseStyleMapping: Record<
//   PriorityStyle,
//   Record<string, Priority>
// > = {
//   "!/!!/!!!": {
//     "!!!": "HIGH",
//     "!!": "MEDIUM",
//     "!": "LOW",
//   },
//   "*/**/***": {
//     "***": "HIGH",
//     "**": "MEDIUM",
//     "*": "LOW",
//   },
//   "1/2/3": {
//     "3": "HIGH",
//     "2": "MEDIUM",
//     "1": "LOW",
//   },
//   none: {
//     "": "HIGH",
//     "": "MEDIUM",
//     "": "LOW",
//   },
// };

export type InternalListOption = ListItem & { id: string };

export type ListOptions = {
  listName: string;
  appDir: string;
  deleteOnDone: boolean;
  priorityStyle: PriorityStyle;
  // priority add-on
  // sortCriteria: "none" | "priority" | "created" | "deadline";
  // sortOrder: "ascending" | "descending";

  // future add-on
  // deadline: boolean
};
