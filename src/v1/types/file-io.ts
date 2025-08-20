import { type Result } from "neverthrow";
import { QLError } from ".";
import { QLCompleteConfig } from "./config";

export type FileInputTypes = QLCompleteConfig;

export type FileInputFunction = <DataType extends FileInputTypes>(
  filepath: string,
) => DataType;

export type FileOutputFunction = <DataType>(
  filepath: string,
  data: DataType,
) => void;
