// import createLogify from "@udawg00/logify";
//
// export default createLogify({
//   level:
//     process.env.NODE_ENV && process.env.NODE_ENV === "production"
//       ? "info"
//       : "debug",
//   withTime: false,
//   context: "ql::",
//   showLevel: false,
// });
//

import chalk from "chalk";

export const DEBUG_HEX = "#00E6DE";
export const INFO_HEX = "#4EC022";
export const WARN_HEX = "#E9E02A";
export const PANIC_HEX = "#EBA931";
export const ERROR_HEX = "#CB5858";

const getFormattedMessage = (message: string) => {
  let output = `\n${chalk.cyan("quiklist::> ")} ${message}\n`;
  return output;
};

const logger = {
  info: (message: string) => {
    console.log(chalk.hex(INFO_HEX).italic(getFormattedMessage(message)));
  },
  debug: (message: string) => {
    if (process.env.NODE_ENV && process.env.NODE_ENV === "production") return;
    console.log(chalk.cyan.italic(getFormattedMessage(message)));
  },
  warn: (message: string) => {
    console.log(chalk.hex(WARN_HEX).italic(getFormattedMessage(message)));
  },
  panic: (message: string) => {
    console.log(chalk.hex(PANIC_HEX).italic(getFormattedMessage(message)));
  },
  error: (message: string) => {
    console.log(chalk.hex(ERROR_HEX).bold(getFormattedMessage(message)));
  },
  hex: (hex: string, message: string) => {
    console.log(chalk.hex(hex).italic(message));
  },
};

export default logger;
