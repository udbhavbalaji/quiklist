import * as os from "os";
import z from "zod";

const pathSchema = z.string().startsWith(os.homedir());

export const pathValidator = async (value: string) => {
  const res = await pathSchema.safeParseAsync(value);

  return res.success ? res.success : res.error.issues[0].message;
};
