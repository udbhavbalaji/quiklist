import { Result } from "neverthrow";

import { QLError } from "@v1/types";
import logger from "@v1/lib/logger";

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

export const asyncErrorHandler = async <ReturnType>(
  fnResult: Promise<Result<ReturnType, QLError>>,
) => {
  const result = await fnResult;

  if (result.isErr()) {
    logger[result.error.messageLevel ?? "error"](result.error.message);
    logger.debug(`Error occurred at: ${result.error.location}`);
    process.exit(1);
  }
  return result.value;
};
