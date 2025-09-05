// External imports
import z from "zod";
import os from "os";

// function that validates a string as a date using zod
export const dateValidator = async (value: string) => {
  const res = await z.iso.date().safeParseAsync(value);

  return res.success ? res.success : res.error.issues[0].message;
};

// function that validates a string as a valid path (that starts with os.homedir())
export const pathValidator = (value: string) => {
  const res = z.string().startsWith(os.homedir()).safeParse(value);

  return res.success ? res.success : res.error.issues[0].message;
};
