export const sort_criteria = [
  "priority",
  "deadline",
  "created date",
  "none",
] as const;
export type SortCriteria = (typeof sort_criteria)[number];
export const priority_styles = [
  "*/**/***",
  "!/!!/!!!",
  "1/2/3",
  "#/##/###",
  "none",
] as const;
export type PriorityStyle = (typeof priority_styles)[number];
export const sort_orders = ["ascending", "descending"] as const;
export type SortOrder = (typeof sort_orders)[number];
export const date_formats = [
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "YYYY/MM/DD",
  "DD/MM/YYYY",
] as const;
export type DateFormat = (typeof date_formats)[number];
export type LogLevel = "debug" | "info" | "warn" | "panic" | "error";
export type QLError = {
  message: string;
  location: string;
  messageLevel?: LogLevel;
};
