// External imports
import { err, Result } from "neverthrow";

// Internal imports
import { LogLevel, QLError } from "@v2/types";
import logger from "@v2/lib/logger";

// wrapper function that handles async errors (returned through the Error class from neverthrow); if no error, return the value
export const asyncErrorHandler = async <ResultType>(
  fnResult: Promise<Result<ResultType, QLError>>,
) => {
  const res = await fnResult;
  if (res.isErr()) {
    logger[res.error.messageLevel ?? "error"](res.error.message);
    logger.debug(`Error occurred at: ${res.error.location}`);
    process.exit(1);
  }
  return res.value;
};

// wrapper function that handles sync errors (returned through the Error class from neverthrow); if no error, return the value
export const errorHandler = <ResultType>(
  fnResult: Result<ResultType, QLError>,
) => {
  if (fnResult.isErr()) {
    logger[fnResult.error.messageLevel ?? "error"](fnResult.error.message);
    logger.debug(`Error occurred at: ${fnResult.error.location}`);
    process.exit(1);
  }
  return fnResult.value;
};

// function that handles errors that can arise from prompts, returns the error using the Error class from neverthrow
export const handlePromptError = async (error: any, location: string) => {
  if (
    error instanceof Error &&
    (error.name === "ExitPromptError" ||
      error.message === "User force closed the prompt with 0 null")
  ) {
    logger.error("Operation terminated.");
    process.exit(0);
  } else {
    return err({
      message: (error as Error).message,
      location: location,
      messageLevel: "error" as LogLevel,
    });
  }
};

// function that handles errors that can arise from file input/output operations, returns the error using the Error class from neverthrow
export const handleIOError = (error: any, location: string) => {
  let errorMessage: string;
  if (error.code === "EACCES") {
    errorMessage = "Permission denied! Use 'sudo' with your command.";
  } else if (error.code === "ENOENT") {
    errorMessage =
      location === "loadMetadata"
        ? "metadata_not_found"
        : "File/directory doesn't exist.";
  } else if (error.code === "EISDIR") {
    errorMessage = "Expected file but found directory";
  } else if (error.code === "ENOTDIR") {
    errorMessage = "Not a directory";
  } else {
    errorMessage = "Something's gone horribly wrong.";
  }
  return err({ message: errorMessage, location });
};
