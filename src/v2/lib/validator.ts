import z from "zod";
import os from "os";

export const dateValidator = async (value: string) => {
  const res = await z.iso.date().safeParseAsync(value);

  return res.success ? res.success : res.error.issues[0].message;
};

export const pathValidator = (value: string) => {
  const res = z.string().startsWith(os.homedir()).safeParse(value);

  return res.success ? res.success : res.error.issues[0].message;
};
