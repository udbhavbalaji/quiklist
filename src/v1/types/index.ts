import { LogLevel } from "@/types/logger";

export const date_formats = ["DD-MM-YYYY", "YYYY-MM-DD"] as const;
export type DateFormat = (typeof date_formats)[number];

export type ArgsOf<T> = T extends (...args: infer Args) => any ? Args : never;

export type QLError = {
  message: string;
  location: string;
  messageLevel?: LogLevel;
};
